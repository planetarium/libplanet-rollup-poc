import { Logger } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { PublicClientManager } from "./evm/public.client";

@WebSocketGateway({ namespace: 'rollup' })
export class AppGateway 
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect 
{
    constructor(
        private readonly publicClientManager: PublicClientManager,
    ) {
        this.register();
    }

    private logger = new Logger('AppGateway');

    activeSockets: Socket[] = [];

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

    private register() {
        this.publicClientManager.watchEvmEvents({
            onDepositETH: (logs) => {},
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
}