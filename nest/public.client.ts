import { Injectable, Logger } from '@nestjs/common';
import { Chain, createPublicClient, getContract, http } from 'viem';
import { mothership, opSepolia, geth } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as txParserAbi } from './abi/TransactionParser';
import { json } from 'stream/consumers';

@Injectable()
export class PublicClientManager {
  constructor(private readonly configure: ConfigService) {
    this.Register();
  }

  private readonly logger = new Logger(PublicClientManager.name);

  public GetPortalContract() {
    return getContract({
      address: '0x30Ba69479c1869a5EF3A612e4888EF84122Ceaba',
      abi: portalAbi,
      client: this.GetClient(),
    });
  }

  public GetTxParserContract() {
    return getContract({
      address: '0xaefA629c63141288E56cfAc1De0B63115DD5726F',
      abi: txParserAbi,
      client: this.GetClient(),
    });
  }

  private Register() {
    const contract = this.GetPortalContract();
    const txParserContract = this.GetTxParserContract();
    contract.watchEvent.DepositETH({
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received deposit event: ${log}`);
        }
      },
    });
    txParserContract.watchEvent.TransactionParsed({
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received parsed tx event: ${log}`);
          this.logger.debug(log.args.transaction);
        }
      },
    });
  }

  private GetChain(chain: string): Chain {
    switch (chain) {
      case 'mothership':
        return mothership;
      case 'opSepolia':
        return opSepolia;
      case 'geth':
        return geth;
      default:
        throw new Error('Invalid chain');
    }
  }

  private GetClient() {
    return createPublicClient({
      chain: this.GetChain(this.configure.get('wallet.chain', 'mothership')),
      transport: http(),
    });
  }
}
