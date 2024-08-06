import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WalletManager } from './wallet.client';
import { ParseTransactionDto } from './dto/parse-transaction.dto';
import { VerifyProofDto } from './dto/verify-proof.dto';
import { DepositEthDto } from './dto/deposit-eth.dto';
import { NCRpcService } from './9c/nc.rpc.service';
import { PublicClientManager } from './public.client';
import { OutputRootProposal } from './9c/nc.respose.models';

@Controller()
export class AppController {
  constructor(
    private readonly wallet: WalletManager,
    private readonly publicClient: PublicClientManager,
    private readonly nc_rpc: NCRpcService
  ) {}

  @Get('send')
  async sendTransaction(): Promise<`0x${string}`> {
    return this.wallet.sendTransaction('0xdeadbeef');
  }

  @Post('deposit')
  async depositETH(@Body() depositEth: DepositEthDto): Promise<`0x${string}`> {
    return this.wallet.depositETH(depositEth.recipient, depositEth.amount);
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

  @Post('verify/proof')
  async verifyProof(@Body() verifyProofDto: VerifyProofDto): Promise<`0x${string}`> {
    let verifyProof = new VerifyProofDto(
      verifyProofDto.txId,
      verifyProofDto.stateRootHash,
      verifyProofDto.proof,
      verifyProofDto.key,
      verifyProofDto.value
    );
    return this.wallet.verifyTxProof(verifyProof.toTransactionWorldProof());
  }

  @Get('propose/outputroot')
  async proposeOutputRoot(): Promise<`0x${string}`> {
    var outputRoot = await this.nc_rpc.getOutputRootProposalFromLocalNetwork();
    return this.wallet.proposeOutputRoot(outputRoot);
  }

  @Get('prove/withdrawal')
  async proveWithdrawal(@Query('txId') txId: string): Promise<string> {
    var blockIndex = await this.nc_rpc.getBlockIndexWithTxIdFromLocalNetwork(txId); // from l2
    var latestOutputRoot = await this.publicClient.GetLatestOutputRoots(); // from l1
    return "test";
  }
}
