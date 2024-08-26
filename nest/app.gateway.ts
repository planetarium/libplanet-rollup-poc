import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { PublicClientManager } from "./evm/public.client";
import { WalletManager } from "./evm/wallet.client";
import { stringify } from "viem";
import { NCRpcService } from "./9c/nc.rpc.service";
import { AppService } from "./app.service";
import { BatcherService } from "./batcher/batcher.service";

@WebSocketGateway({ namespace: 'rollup' })
export class AppGateway 
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect 
{
    constructor(
        private readonly publicClientManager: PublicClientManager,
        private readonly walletManger: WalletManager,
        private readonly ncRpcService: NCRpcService,
        private readonly appService: AppService,
        private readonly batcherService: BatcherService
    ) {
        this.register();
    }

    private logger = new Logger('AppGateway');

    activeSockets: Socket[] = [];

    checkingOutputroot: `0x${string}` = '0x';
    outputrootUpdated: boolean = true;

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

        this.sendDepositLog("- L2 Mothership Process -");
        await this.walletManger.switchClient(from);
        var res = await this.walletManger.depositETH(recipient, amount);
        await this.walletManger.switchClient('main');
        this.sendDepositLog("Depsit ETH requested");
        this.sendDepositLog("Tx Hash: " + res);
        this.sendDepositLog('Waiting for deposit event...');
    }

    @SubscribeMessage('onWithdrawRequested')
    async onWithdrawRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var from: `main` | `sub` = data.from;
        var recipient = data.recipient;
        var amount = data.amount ? BigInt(data.amount) : BigInt(0);

        this.sendWithdrawLog("- L3 Libplanet Process -");
        var res = await this.appService.withdrawETH(from, recipient, amount);
        this.sendWithdrawLog("Withdraw ETH requested");
        this.sendWithdrawLog("Tx Id: " + res);
        this.sendWithdrawLog('Latest output root info:');
        var outputRootInfo = await this.appService.getLatestOutputRoots();
        this.sendWithdrawLog({
            outputRoot: outputRootInfo?.outputRoot,
            l3OutputIndex: outputRootInfo?.l2OutputIndex,
            l3BlockNumber: outputRootInfo?.l2BlockNumber,
            l2Timestamp: outputRootInfo?.l1Timestamp
        });
        this.outputrootUpdated = false;
        this.checkingOutputroot = outputRootInfo?.outputRoot!;
        this.sendWithdrawLog('Output root should be proposed...');
    }

    @SubscribeMessage('onProveRequested')
    async onProveRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var txId = data.txId;

        this.sendProveLog("- L3 Libplanet Process -");
        this.sendProveLog("Getting withdrawal transaction proof infos from L3...");
        var withdrawalTransactionProofInfos = await this.appService.getWithdrawalTransactionProofInfos(txId);
        this.sendProveLog("Withdrawal transaction proof infos:");
        this.sendProveLog(withdrawalTransactionProofInfos);

        this.sendProveLog("- L2 Mothership Process -");
        var res = await this.walletManger.proveWithdrawalTransaction(
            withdrawalTransactionProofInfos.withdrawalTransaction,
            withdrawalTransactionProofInfos.l2OutputIndex,
            withdrawalTransactionProofInfos.outputRootProposal,
            withdrawalTransactionProofInfos.withdrawalProof
        );
        this.sendProveLog("Prove withdrawal requested to L2");
        this.sendProveLog("Tx Hash: " + res);
        this.sendProveLog('Waiting for withdrawal proven event...');
    }

    @SubscribeMessage('onFinalizeRequested')
    async onFinalizeRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var txId = data.txId;

        this.sendFinalizeLog("- L3 Libplanet Process -");
        this.sendFinalizeLog("Getting withdrawal transaction info from L3...");
        var withdrawalTransactionProofInfos = await this.appService.getWithdrawalTransactionProofInfos(txId);
        var withdrawalTransaction = withdrawalTransactionProofInfos.withdrawalTransaction;
        this.sendFinalizeLog("Withdrawal transaction info:");
        this.sendFinalizeLog(withdrawalTransaction);

        this.sendFinalizeLog("- L2 Mothership Process -");
        var res = await this.walletManger.finalizeWithdrawalTransaction(withdrawalTransaction);
        this.sendFinalizeLog("Finalize withdrawal requested to L2");
        this.sendFinalizeLog("Tx Hash: " + res);
        this.sendFinalizeLog('Waiting for withdrawal finalized event...');
    }

    @SubscribeMessage('onProcessRequested')
    async onProcessRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var stop = BigInt(data.stop);
        
        this.sendProcessLog("- L3 Libplanet Process -");
        var lastTxHash: `0x${string}` = '0x';
        do {
            await this.batcherService.loadBlocksIntoState(100);
            await this.batcherService.publishTxToL1();
            this.sendProcessLog('Compressed until ' + this.batcherService.lastStoredBlock!.index + ' block');
            if (this.batcherService.sentTransactions.length > 0) {
                var txHash = this.batcherService.sentTransactions[this.batcherService.sentTransactions.length - 1];
                if (!(lastTxHash === txHash)) {
                    lastTxHash = txHash;
                    this.sendProcessLog('Batch transaction sent');
                    this.sendProcessLog('Tx Hash: ' + txHash);
                }
            }
        } while (this.batcherService.lastStoredBlock!.index < stop);

        this.sendProcessLog('Sent transaction hashs:');
        this.sendProcessLog(this.batcherService.sentTransactions);

        this.sendProcessLog('Process completed');
    }

    private register() {
        this.publicClientManager.watchEvmEvents({
            onDepositETH: (logs) => {
                this.handleOnDepositETH(logs);
            },
            onWithdrawalProven: (logs) => {
                this.handleOnWithdrawalProven(logs);
            },
            onWithdrawalFinalized: (logs) => {
                this.handleOnWithdrawalFinalized(logs);
            },
            onOutputProposed: (logs) => {
                this.handleOnOutputProposed(logs);
            },
        })
    }

    async handleOnDepositETH(logs: any) {
        for (const log of logs) {
            this.sendDepositLog("Deposit ETH event received");
            this.sendDepositLog(log.args);
            var recipient = log.args.to!;
            var amount = log.args.amount!;
            
            this.sendDepositLog('- L3 Libplanet Process -');
            var ok = await this.ncRpcService.mintWethToLocalNetwork(recipient, amount);
            if(ok) {
                this.sendDepositLog(`Mint ${amount} WETH to ${recipient} requested`);
                this.sendDepositLog('Waiting for mint...');
                await this.delay(5000);
                await this.updateBalances('onDepositLog');
            }
        }
    }

    async handleOnWithdrawalProven(logs: any) {
        for (const log of logs) {
            this.sendProveLog('Withdrawal proven event received');
            this.sendProveLog(log.args);
        }
    }

    async handleOnWithdrawalFinalized(logs: any) {
        for (const log of logs) {
            this.sendFinalizeLog('Withdrawal finalized event received');
            this.sendFinalizeLog(log.args);

            await this.updateBalances('onFinalizeLog');
        }
    }

    async handleOnOutputProposed(logs: any) {
        for (const log of logs) {
            this.outputRootChecking(log.args);
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
    }

    outputRootChecking(outputRootInfo: any) {
        if(this.outputrootUpdated) {
            return;
        }
        if(!(this.checkingOutputroot === outputRootInfo.outputRoot)) {
            this.outputrootUpdated = true;
            this.sendWithdrawLog('- L2 Mothership Process -');
            this.sendWithdrawLog('Output root is updated');
            this.sendWithdrawLog({
                outputRoot: outputRootInfo.outputRoot,
                l3OutputIndex: outputRootInfo.l2OutputIndex,
                l3BlockNumber: outputRootInfo.l2BlockNumber,
                l2Timestamp: outputRootInfo.l1Timestamp
            });
            this.sendWithdrawLog('Withdrawal could be proven now');

            this.updateBalances('onWithdrawLog');
        }
    }

    async updateBalances(socketLog?: string) {
        var balances = await this.appService.getBalancesForWeb();
        for (const socket of this.activeSockets) {
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
        return balances;
    }

    sendDepositLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit('onDepositLog', text);
        }
    }

    sendWithdrawLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit('onWithdrawLog', text);
        }
    }

    sendProveLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit('onProveLog', text);
        }
    }

    sendFinalizeLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit('onFinalizeLog', text);
        }
    }

    sendProcessLog(log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        for (const socket of this.activeSockets) {
            socket.emit('onProcessLog', text);
        }
    }

    async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}