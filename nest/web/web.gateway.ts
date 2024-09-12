import { Injectable, Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { PublicClientManager } from "nest/evm/public.client";
import { WalletManager } from "nest/evm/wallet.client";
import { Socket } from "socket.io";
import { parseAbiItem, parseEventLogs, stringify, TransactionReceipt } from "viem";
import { WebService } from "./web.service";
import { EvmService } from "nest/evm/evm.service";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { randomBytes } from "crypto";
import { BatcherService } from "nest/batcher/batcher.service";
import { DeriverService } from "nest/deriver/deriver.service";
import { ProposerService } from "nest/proposer/proposer.service";

@WebSocketGateway({ namespace: 'rollup' })
export class WebGateway 
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    constructor(
        private readonly webService: WebService,
        private readonly walletManager: WalletManager,
        private readonly publicClientManager: PublicClientManager,
        private readonly evmService: EvmService,
        private readonly ncRpcService: NCRpcService,
        private readonly batcherService: BatcherService,
        private readonly deriverService: DeriverService,
        private readonly proposerService: ProposerService,
    ) {
        this.register();
        this.batcherService.setWebLog(this.sendBatcherLog.bind(this));
        this.deriverService.setWebLog(this.sendDerivaterLog.bind(this));
        this.proposerService.setWebLog(this.sendProposerLog.bind(this));
    }

    private logger = new Logger('WebGateway');

    private ON_DEPOSIT_LOG = 'onDepositLog';
    private ON_WITHDRAW_LOG = 'onWithdrawLog';
    private ON_PROVE_LOG = 'onProveLog';
    private ON_FINALIZE_LOG = 'onFinalizeLog';
    private ON_BULK_LOG = 'onBulkLog';
    private ON_BATCHER_LOG = 'onBatcherLog';
    private ON_DERIVATER_LOG = 'onDerivaterLog';
    private ON_PROPOSER_LOG = 'onProposerLog';

    private activeSockets: Socket[] = [];

    afterInit() {
        this.logger.log('Initialized');
    }

    handleConnection(@ConnectedSocket() socket: Socket) {
        this.logger.log(`Client connected: ${socket.id}`);
        this.activeSockets.push(socket);
    }

    handleDisconnect(@ConnectedSocket() socket: Socket) {
        this.logger.log(`Client disconnected: ${socket.id}`);
        this.activeSockets = this.activeSockets.filter(s => s.id !== socket.id);
    }

    @SubscribeMessage('onDepositRequested')
    async onDepositRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var from: `main` | `sub` = data.from;
        var recipient = data.recipient;
        var amount = data.amount ? BigInt(data.amount) : BigInt(0);

        try {
            this.sendDepositLog(socket, "- L2 Mothership Process -");
            await this.walletManager.switchClient(from);
            var txHash = await this.walletManager.depositETH(recipient, amount);
            await this.walletManager.switchClient('main');
            this.sendDepositLog(socket, "Deposit ETH requested");
            this.sendDepositLog(socket, "Tx Hash: " + txHash);
            this.sendDepositLog(socket, 'Waiting for deposit event...');
            const res: TransactionReceipt = await this.publicClientManager.waitForTransactionReceipt(txHash);
            const eventAbi = parseAbiItem('event EthDeposited(address indexed from, address indexed to, uint256 indexed amount)');
            const event = parseEventLogs({
                abi: [eventAbi],
                logs: res.logs
            })[0].args;
            this.sendDepositLog(socket, 'EthDeposited event received');
            this.sendDepositLog(socket, event);

            this.sendDepositLog(socket, '- L3 Libplanet Prcess -');
            this.sendDepositLog(socket, `Minting ${event.amount} WETH to ${event.to} will be requested`);
            this.sendDepositLog(socket, 'Waiting for minting...');
            await this.delay(5000);
            await this.updateBalances(socket, this.ON_DEPOSIT_LOG);
            this.sendDepositLog(socket, 'We can\'t check the minting status here so updated L3 balance could be not reflected.');
        } catch(e) {
            this.sendDepositLog(socket, 'Error: ' + e);
        }
    }

    private sendDepositLog(socket:Socket, log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        socket.emit(this.ON_DEPOSIT_LOG, text);
    }

    @SubscribeMessage('onWithdrawRequested')
    async onWithdrawRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var from: `main` | `sub` = data.from;
        var recipient = data.recipient;
        var amount = data.amount ? BigInt(data.amount) : BigInt(0);

        try{
            this.sendWithdrawLog(socket, "- L3 Libplanet Process -");
            var res = await this.webService.withdrawETH(from, recipient, amount);
            this.sendWithdrawLog(socket, "Withdraw ETH requested");
            this.sendWithdrawLog(socket, "Tx Id: " + res);
            this.sendWithdrawLog(socket, 'Latest output root info:');
            var outputRootInfo = await this.webService.getLatestOutputRoots();
            this.sendWithdrawLog(socket, {
                outputRoot: outputRootInfo?.outputRoot,
                l3OutputIndex: outputRootInfo?.l2OutputIndex,
                l3BlockNumber: outputRootInfo?.l2BlockNumber,
                l2Timestamp: outputRootInfo?.l1Timestamp
            });
            this.sendWithdrawLog(socket, 'You need to wait for the withdrawal transaction to be included in the next output root to prove it.');
            this.sendWithdrawLog(socket, 'If you want to propose the output root quickly, you can send bulk transactions. See Utils tab.');

            await this.delay(5000);
            await this.updateBalances(socket, this.ON_WITHDRAW_LOG);
        } catch(e) {
            this.sendWithdrawLog(socket, 'Error: ' + e);
        }
    }

    private sendWithdrawLog(socket: Socket, log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        socket.emit(this.ON_WITHDRAW_LOG, text);
    }

    @SubscribeMessage('onProveRequested')
    async onProveRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var txId = data.txId;

        try {
            this.sendProveLog(socket, "- L3 Libplanet Process -");
            this.sendProveLog(socket, "Getting withdrawal transaction proof infos from L3...");
            var withdrawalTransactionProofInfos = await this.evmService.getWithdrawalTransactionProofInfos(txId);
            this.sendProveLog(socket, "Withdrawal transaction proof infos:");
            this.sendProveLog(socket, withdrawalTransactionProofInfos);

            this.sendProveLog(socket, "- L2 Mothership Process -");
            var txHash = await this.walletManager.proveWithdrawalTransaction(
                withdrawalTransactionProofInfos.withdrawalTransaction,
                withdrawalTransactionProofInfos.l2OutputIndex,
                withdrawalTransactionProofInfos.outputRootProposal,
                withdrawalTransactionProofInfos.withdrawalProof
            );
            this.sendProveLog(socket, "Prove withdrawal requested to L2");
            this.sendProveLog(socket, "Tx Hash: " + txHash);
            this.sendProveLog(socket, 'Waiting for withdrawal proven event...');
            const res: TransactionReceipt = await this.publicClientManager.waitForTransactionReceipt(txHash);
            const eventAbi = parseAbiItem('event WithdrawalProven(address indexed withdrawalHash, address indexed from, address indexed to, uint256 amount)');
            const event = parseEventLogs({
                abi: [eventAbi],
                logs: res.logs
            })[0].args;
            this.sendProveLog(socket, 'WithdrawalProven event received');
            this.sendProveLog(socket, event);
        }
        catch(e) {
            this.sendProveLog(socket, 'Error: ' + e);
        }
    }

    private sendProveLog(socket: Socket, log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        socket.emit(this.ON_PROVE_LOG, text);
    }

    @SubscribeMessage('onFinalizeRequested')
    async onFinalizeRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var txId = data.txId;

        try {
            this.sendFinalizeLog(socket, "- L3 Libplanet Process -");
            this.sendFinalizeLog(socket, "Getting withdrawal transaction info from L3...");
            var withdrawalTransactionProofInfos = await this.evmService.getWithdrawalTransactionProofInfos(txId);
            var withdrawalTransaction = withdrawalTransactionProofInfos.withdrawalTransaction;
            this.sendFinalizeLog(socket, "Withdrawal transaction info:");
            this.sendFinalizeLog(socket, withdrawalTransaction);

            this.sendFinalizeLog(socket, "- L2 Mothership Process -");
            var txHash = await this.walletManager.finalizeWithdrawalTransaction(withdrawalTransaction);
            this.sendFinalizeLog(socket, "Finalize withdrawal requested to L2");
            this.sendFinalizeLog(socket, "Tx Hash: " + txHash);
            this.sendFinalizeLog(socket, 'Waiting for withdrawal finalized event...');

            const res: TransactionReceipt = await this.publicClientManager.waitForTransactionReceipt(txHash);
            const eventAbi = parseAbiItem('event WithdrawalFinalized(address indexed withdrawalHash, bool success)');
            const event = parseEventLogs({
                abi: [eventAbi],
                logs: res.logs
            })[0].args;
            this.sendFinalizeLog(socket, 'WithdrawalFinalized event received');
            this.sendFinalizeLog(socket, event);
            await this.updateBalances(socket, this.ON_FINALIZE_LOG);
        }
        catch(e) {
            this.sendFinalizeLog(socket, 'Error: ' + e);
        }
    }

    private sendFinalizeLog(socket: Socket, log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        socket.emit(this.ON_FINALIZE_LOG, text);
    }

    @SubscribeMessage('onBulkRequested')
    async onBulkRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        try {
            this.sendBulkLog(socket, "- L3 Libplanet Process -");
            for(let i=0; i<20; i++){
                await this.ncRpcService.sendSimpleTransaction(randomBytes(16384).toString('hex'));
                this.sendBulkLog(socket, `Bulk transaction ${i} requested to L3`);
            }
        } catch(e) {
            this.sendBulkLog(socket, 'Error: ' + e);
        }
    }

    private sendBulkLog(socket: Socket, log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        socket.emit(this.ON_BULK_LOG, text);
    }

    private sendBatcherLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit(this.ON_BATCHER_LOG, text);
        }
    }

    private sendDerivaterLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit(this.ON_DERIVATER_LOG, text);
        }
    }

    private sendProposerLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit(this.ON_PROPOSER_LOG, text);
        }
    }

    private async updateBalances(socket: Socket, socketLog?: string) {
        var balances = await this.webService.getBalances();
        if(socketLog) {
            socket.emit(socketLog, 'Balances updated');
            var balancesForWeb = {
                l2FirstAddressBalance: balances.l1FirstAddressBalance,
                l3FirstAddressBalance: balances.l2FirstAddressBalance,
                l2SecondAddressBalance: balances.l1SecondAddressBalance,
                l3SecondAddressBalance: balances.l2SecondAddressBalance,
            }
            socket.emit(socketLog, balancesForWeb);
        }

        socket.emit('onBalancesUpdated', balances);
    }

    private register() {
        this.publicClientManager.watchEvmEvents({
            onEthDeposited: (logs) => {},
            onWithdrawalProven: (logs) => {},
            onWithdrawalFinalized: (logs) => {},
            onOutputProposed: (logs) => {
                for (const log of logs) {
                    for (const socket of this.activeSockets) {
                        var res = {
                            outputRoot: log.args.outputRoot,
                            l2OutputIndex: log.args.l2OutputIndex?.toString(),
                            l2BlockNumber: log.args.l2BlockNumber?.toString(),
                            l1Timestamp: log.args.l1Timestamp?.toString(),
                        }
                        socket.emit('onOutputProposed', res);
                    }
                }
            },
        })
    }

    private async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}