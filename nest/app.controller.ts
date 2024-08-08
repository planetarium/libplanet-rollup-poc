import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { DepositEthDto } from './dto/deposit-eth.dto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService
  ) {}

  @Get('send')
  sendTransaction(): Promise<`0x${string}`> {
    return this.appService.sendTransaction();
  }

  @Post('deposit')
  async depositETH(@Body() depositEth: DepositEthDto): Promise<`0x${string}`> {
    return this.appService.depositETH(depositEth.recipient, depositEth.amount);
  }

  @Get('propose/outputroot')
  async proposeOutputRoot(): Promise<`0x${string}`> {
    return this.appService.proposeOutputRoot();
  }

  @Get('prove/withdrawal')
  async proveWithdrawal(@Query('txId') txId: string): Promise<`0x${string}`> {
    return this.appService.proveWithdrawal(txId);
  }

  @Get('finalize/withdrawal')
  async finalizeWithdrawal(@Query('txId') txId: string): Promise<`0x${string}`> {
    return this.appService.finalizeWithdrawal(txId);
  }

  @Get('balance')
  async getBalance(@Query('address') address: `0x${string}`): Promise<bigint> {
    return this.appService.getBalance(address);
  }
}
