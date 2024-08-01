import { Controller, Get, Post, Body } from '@nestjs/common';
import { NCRpcService } from './nc.rpc.service';
import { DepositEthDto } from 'nest/dto/deposit-eth.dto';

@Controller('9c')
export class NCController {
  constructor(private readonly RPCService: NCRpcService) {}

  @Get('blocks')
  async getBlocks() {
    return this.RPCService.getBlocks();
  }

  @Get('transactions')
  async getTransactions() {
    return this.RPCService.getTransactions();
  }

  @Post('mint')
  async mintWeth(@Body() depositEth: DepositEthDto): Promise<boolean> {
    return this.RPCService.mintWethToLocalNetwork(depositEth.recipient, depositEth.amount);
  }
}
