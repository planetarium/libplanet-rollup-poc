import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { PublicClientManager } from "nest/evm/public.client";
import { WalletManager } from "nest/evm/wallet.client";
import { Socket } from "socket.io";
import { parseAbiItem, parseEventLogs, stringify, TransactionReceipt } from "viem";
import { WebService } from "./web.service";

@WebSocketGateway({ namespace: 'rollup' })
export class WebGateway 
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    constructor(
        private readonly webService: WebService,
        private readonly walletManager: WalletManager,
        private readonly publicClientManger: PublicClientManager,
    ) {}

    private logger = new Logger('WebGateway');

    private ON_DEPOSIT_LOG = 'onDepositLog';

    afterInit() {
        this.logger.log('Initialized');
    }

    handleConnection(@ConnectedSocket() socket: Socket) {
        this.logger.log(`Client connected: ${socket.id}`);
    }

    handleDisconnect(@ConnectedSocket() socket: Socket) {
        this.logger.log(`Client disconnected: ${socket.id}`);
    }

    @SubscribeMessage('onDepositRequested')
    async onDepositRequested(
        @ConnectedSocket() socket: Socket,
        @MessageBody() data: any
    ) {
        var from: `main` | `sub` = data.from;
        var recipient = data.recipient;
        var amount = data.amount ? BigInt(data.amount) : BigInt(0);

        this.sendDepositLog(socket, "- L2 Mothership Process -");
        await this.walletManager.switchClient(from);
        var txHash = await this.walletManager.depositETH(recipient, amount);
        await this.walletManager.switchClient('main');
        this.sendDepositLog(socket, "Deposit ETH requested");
        this.sendDepositLog(socket, "Tx Hash: " + txHash);
        this.sendDepositLog(socket, 'Waiting for deposit event...');
        const res: TransactionReceipt = await this.publicClientManger.waitForTransactionReceipt(txHash);
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
    }

    sendDepositLog(socket:Socket, log: any) {
        var text = typeof log === 'string' ? log : stringify(log, null, 2);
        socket.emit(this.ON_DEPOSIT_LOG, text);
    }

    async updateBalances(socket: Socket, socketLog?: string) {
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

    async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}