import { Controller, Get } from "@nestjs/common";
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
}