import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { ChallengerService } from "./challenger.service";
import { MakeNewGameDto } from "./challenger.dto";

@Controller("challenger")
export class ChallengerController {
  constructor(
    private readonly challengerService: ChallengerService,
  ) {}

  @Get("attach-dishonest-challenger")
  attachDishonestChallenger() {
    this.challengerService.attachDishonestChallengerNext();
    return "OK | Dishonest challenger will be attached in the next dispute game.";
  }

  @Get("dispute-info")
  async getDisputeInfo() {
    return await this.challengerService.getDisputeInfo();
  }

  @Get("game-info")
  async getGameInfo(
    @Query("address") address: `0x${string}`,
  ) {
    return await this.challengerService.getDisputeGameDetailInfo(address);
  }

  @Post("make-new-game")
  async makeNewGame(
    @Headers('private-key') privateKey: `0x${string}`,
    @Body() makeNewGameDto: MakeNewGameDto
  ) {
    return await this.challengerService.makeNewGame(
      privateKey,
      makeNewGameDto.l3OutputRoot,
      BigInt(makeNewGameDto.l3BlockNumber)
    )
  }
}