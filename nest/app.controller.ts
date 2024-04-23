import { Controller, Get } from '@nestjs/common';
import { WalletManager } from './wallet.client';

@Controller()
export class AppController {
  constructor(private readonly wallet: WalletManager) {}

  @Get('send')
  async sendTransaction(): Promise<`0x${string}`> {
    return this.wallet.sendTransaction('0xdeadbeef');
  }
}
