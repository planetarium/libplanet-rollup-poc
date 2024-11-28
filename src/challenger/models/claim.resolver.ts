import { EvmPublicService } from "src/evm/evm.public.service";
import { ClaimData } from "../challenger.type";
import { ClaimClock } from "../utils/claim.clock";
import { FaultDisputeGameBuilder } from "./faultdisputegame.builder";
import { Logger } from "@nestjs/common";

export class ClaimResolver {
  constructor(
    private readonly faultDisputeGameBuilder: FaultDisputeGameBuilder,
    private readonly evmPublicService: EvmPublicService,
  ) {
    const disputeGameProxy = this.faultDisputeGameBuilder.build().address;
    this.CHALLENGER_ID = disputeGameProxy.slice(2, 5);
    this.logger = new Logger(`ClaimResolver-${this.CHALLENGER_ID}`);
  }

  private readonly CHALLENGER_ID: string;
  private readonly logger: Logger;

  private readonly TIME_BUFFER = 20n;

  public async tryResolveAllClaims(claims: ClaimData[], currentTimestamp: bigint, maxClockDuration: bigint) {
    const claimCount = claims.length;
    const claimClock = claims[claimCount - 1].clock;
    const lastClaimTimeExpired = await this.timeExpired(claimClock, currentTimestamp, maxClockDuration);
    if(!lastClaimTimeExpired) {
      return false;
    }

    for (let i = claims.length - 1; i >= 0; i--) {
      const claimIndex = BigInt(i);
      const claimClock = claims[i].clock;
      const resolveEnabled = await this.checkResolveEnabled(claimIndex, claimClock, currentTimestamp, maxClockDuration);
      if (resolveEnabled) {
        this.logger.debug(`Resolving claim ${claimIndex}`);
        const faultDisputeGame = this.faultDisputeGameBuilder.build();
        try {
          const txHash = await faultDisputeGame.write.resolveClaim([claimIndex]);
          await this.evmPublicService.waitForTransactionReceipt(txHash);
        } catch(e) {
          this.logger.error(`Failed to resolve claim ${claimIndex}`);
          return false;
        }
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

    const expired = await this.timeExpired(claimClock, currentTimestamp, maxClockDuration);
    if(!expired) {
      return false;
    }

    return true;
  }

  private async timeExpired(claimClock: bigint, currentTimestamp: bigint, maxClockDuration: bigint) {
    const libClock = new ClaimClock(claimClock);
    const claimDuration = libClock.duration();
    const claimTimestamp = libClock.timestamp();
    return currentTimestamp + claimDuration > claimTimestamp + maxClockDuration + this.TIME_BUFFER;
  }
}