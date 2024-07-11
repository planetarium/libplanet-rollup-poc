import { Controller, Get } from '@nestjs/common';
import { NCRpcService } from './nc.rpc.service';

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
}
