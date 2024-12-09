import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { BridgeService } from "./bridge.service";
import { DepositEthDto } from "./bridge.dto";

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
}