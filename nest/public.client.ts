import { Injectable, Logger } from '@nestjs/common';
import { Chain, createPublicClient, getContract, http } from 'viem';
import { mothership, opSepolia } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as portalAbi } from './abi/LibplanetPortal';

@Injectable()
export class PublicClientManager {
  constructor(private readonly configure: ConfigService) {
    this.Register();
  }

  private readonly logger = new Logger(PublicClientManager.name);

  public GetPortalContract() {
    return getContract({
      address: '0x5F0641fAa5bd2364F0992fD7721975A7f604D5c5',
      abi: portalAbi,
      client: this.GetClient(),
    });
  }

  private Register() {
    const contract = this.GetPortalContract();
    contract.watchEvent.DepositETH({
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received deposit event: ${log}`);
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
