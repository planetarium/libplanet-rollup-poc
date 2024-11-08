import { ClaimData } from "../challenger.type";
import { ClaimClock } from "../utils/claim.clock";
import { FaultDisputeGameBuilder } from "./faultdisputegame.builder";

export class ClaimResolver {
  constructor(
    private readonly faultDisputeGameBuilder: FaultDisputeGameBuilder,
  ) {}

  public async tryResolveAllClaims(claims: ClaimData[], currentTimestamp: bigint, maxClockDuration: bigint) {
    const claimCount = claims.length;
    for (let i = claims.length - 1; i <= 0; i++) {
      const claimIndex = BigInt(i);
      const claimClock = claims[i].clock;
      const resolveEnabled = await this.checkResolveEnabled(claimIndex, claimClock, currentTimestamp, maxClockDuration);
      if (resolveEnabled) {
        const faultDisputeGame = this.faultDisputeGameBuilder.build();
        await faultDisputeGame.write.resolveClaim([claimIndex]);
      }
    }

    const resolvedCount = await this.countResolved(claims);
    return resolvedCount === claimCount;
  }

  private async countResolved(claims: ClaimData[]) {
    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    var resolvedCount: number = 0;
    for(let i = 0; i < claims.length; i++) {
      const resolved = await faultDisputeGame.read.resolvedSubgames([BigInt(i)]);
      if (resolved) {
        resolvedCount++;
      }
    }
    return resolvedCount;
  }

  private async checkResolveEnabled(claimIndex: bigint, claimClock: bigint, currentTimestamp: bigint, maxClockDuration: bigint) {
    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    const resolved = await faultDisputeGame.read.resolvedSubgames([claimIndex]);
    if (resolved) {
      return false;
    }

    const libClock = new ClaimClock(claimClock);
    const claimDuration = libClock.duration();
    const claimTimestamp = libClock.timestamp();

    return claimDuration + currentTimestamp >= maxClockDuration + claimTimestamp;
  }
}