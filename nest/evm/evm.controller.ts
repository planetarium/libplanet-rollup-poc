import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { EvmService } from "./evm.service";
import { DepositEthDto } from "nest/dto/deposit-eth.dto";

@Controller('geth')
export class EvmController {
    constructor(
        private readonly evmService: EvmService
      ) {}
    
      @Get('send')
      sendTransaction(): Promise<`0x${string}`> {
        return this.evmService.sendTransaction();
      }

      @Get('send/eth')
      async sendEthTransaction(
        @Query('to') to: `0x${string}`,
        @Query('amount') amount: bigint
      ): Promise<`0x${string}`> {
        return await this.evmService.sendEth(to, amount);
      }
    
      @Post('deposit')
      async depositETH(@Body() depositEth: DepositEthDto) {
        return await this.evmService.depositETH(depositEth.recipient, depositEth.amount);
      }
    
      @Get('propose/outputroot')
      async proposeOutputRoot(): Promise<`0x${string}`> {
        return this.evmService.proposeOutputRoot();
      }
    
      @Get('prove/withdrawal')
      async proveWithdrawal(@Query('txId') txId: string): Promise<`0x${string}`> {
        return this.evmService.proveWithdrawal(txId);
      }
    
      @Get('finalize/withdrawal')
      async finalizeWithdrawal(@Query('txId') txId: string): Promise<`0x${string}`> {
        return this.evmService.finalizeWithdrawal(txId);
      }
    
      @Get('balance')
      async getBalance(@Query('address') address: `0x${string}`): Promise<bigint> {
        return this.evmService.getBalance(address);
      }

      @Get('address')
      async getAddress() {
        return this.evmService.getAddress();
      }
}