import { Controller, Get, Post, Body } from '@nestjs/common';
import { NCRpcService } from './nc.rpc.service';
import { DepositEthDto } from 'nest/dto/deposit-eth.dto';
import { WithdrawEthDto } from 'nest/dto/withdraw-eth.dto';
import { randomBytes } from 'crypto';

@Controller('libplanet')
export class NCController {
  constructor(private readonly RPCService: NCRpcService) {}

  @Post('mint')
  async mintWeth(@Body() depositEth: DepositEthDto): Promise<boolean> {
    return this.RPCService.mintWeth(depositEth.recipient, depositEth.amount);
  }

  @Post('withdraw')
  async withdrawEth(@Body() withdrawEth: WithdrawEthDto): Promise<string> {
    return this.RPCService.withdrawEth(
      withdrawEth.privateKey,
      withdrawEth.recipient,
      withdrawEth.amount,
    );
  }

  @Get('send/bulk')
  async sendBulk() {
    for(let i=0; i<100; i++){
      await this.RPCService.sendSimpleTransaction(randomBytes(16384).toString('hex'));
    }
  }

  @Get('outputroot')
  async getOutputRoot() {
    var outputProposal = await this.RPCService.getOutputRootProposal();
    return {
      blockIndex: Number(outputProposal.blockIndex),
      stateRootHash: outputProposal.stateRootHash,
      storageRootHash: outputProposal.storageRootHash,
    }
  }
}
