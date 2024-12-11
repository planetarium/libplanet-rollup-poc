import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { BridgeService } from "./bridge.service";
import { DepositEthDto, FinalizeWithdrawalDto, ProveWithdrawalDto, WithdrawEthDto } from "./bridge.dto";

@Controller("bridge")
export class BridgeController {
  constructor(
    private readonly bridgeService: BridgeService,
  ) {}

  @Get("get-balance")
  public async getBalance(
    @Headers('private-key') privateKey: `0x${string}`,
  ) {
    return await this.bridgeService.getBalance(privateKey);
  }

  @Post("deposit-eth")
  public async depositEth(
    @Headers('private-key') privateKey: `0x${string}`,
    @Body() depositEthDto: DepositEthDto
  ) {
    return await this.bridgeService.depositEth(
      privateKey,
      depositEthDto.receipient,
      BigInt(depositEthDto.amount),
    );
  }

  @Post("withdraw-eth")
  public async withdrawEth(
    @Headers('private-key') privateKey: `0x${string}`,
    @Body() withdrawEth: WithdrawEthDto
  ) {
    return await this.bridgeService.withdrawEth(
      privateKey,
      withdrawEth.receipient,
      BigInt(withdrawEth.amount),
    );
  }

  @Post("prove-withdrawal")
  public async proveWithdrawal(
    @Headers('private-key') privateKey: `0x${string}`,
    @Body() proveWithdrawalDto: ProveWithdrawalDto
  ) {
    return await this.bridgeService.proveWithdrawal(privateKey, proveWithdrawalDto.txId);
  }

  @Post("finalize-withdrawal")
  public async finalizeWithdrawal(
    @Headers('private-key') privateKey: `0x${string}`,
    @Body() finalizeWithdrawalDto: FinalizeWithdrawalDto
  ) {
    return await this.bridgeService.finalizeWithdrawal(privateKey, finalizeWithdrawalDto.txId, finalizeWithdrawalDto.proofSubmitter);
  }
}