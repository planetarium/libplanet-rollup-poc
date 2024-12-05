import { Controller, Get, Query } from "@nestjs/common";
import { ChallengerService } from "./challenger.service";

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
}