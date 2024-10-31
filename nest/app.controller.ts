import { Controller, Get, Post, Body } from '@nestjs/common';
import { WalletManager } from './wallet.client';
import { ParseTransactionDto } from './dto/parse-transaction.dto';

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

  @Post('parse/tx')
  async parseTransaction(@Body() parseTransaction: ParseTransactionDto): Promise<`0x${string}`> {
    var serializedPayload = Buffer.from(parseTransaction.serializedPayload, 'utf-8').toString('hex');
    return this.wallet.parseTx('0x'.concat(serializedPayload) as `0x${string}`);
  }

  @Post('parse/has')
  async parseHackAndSlash(@Body() parseTransaction: ParseTransactionDto): Promise<`0x${string}`> {
    var serializedPayload = Buffer.from(parseTransaction.serializedPayload, 'utf-8').toString('hex');
    return this.wallet.parseHackAndSlash('0x'.concat(serializedPayload) as `0x${string}`);
  }
}
