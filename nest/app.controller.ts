import { Controller, Get } from '@nestjs/common';
import { WalletManager } from './wallet.client';

@Controller()
export class AppController {
  constructor(private readonly wallet: WalletManager) {}

  @Get('send')
  async sendTransaction(): Promise<`0x${string}`> {
    return this.wallet.sendTransaction('0xdeadbeef');
  }

  @Get('deposit')
  async depositETH(): Promise<`0x${string}`> {
    return this.wallet.depositETH(10000);
  }

  @Get('deposit/geth')
  async gethDepositETH(): Promise<`0x${string}`> {
    return this.wallet.gethDepositETH(10000);
  }
}
