import { Injectable } from "@nestjs/common";
import { ChallengerPropser } from "./challenger.proposer";

@Injectable()
export class ChallengerService {
  constructor(
    private readonly challengerProposer: ChallengerPropser,
  ) {}

  public async init() {
    this.challengerProposer.init();

    // todo: get all unresolved disputes and attach honest challengers
    // todo: attach event to pull the event that create dispute and attach honest challenger
    // todo: make honest challengers well
  }
}