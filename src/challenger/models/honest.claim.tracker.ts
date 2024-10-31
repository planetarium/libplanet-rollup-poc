import { ClaimData, claimId } from "../challenger.type";

export class HonestClaimTracker {
  private agreed = new Map<`0x${string}`, boolean>();
  private counters = new Map<`0x${string}`, ClaimData>();

  public addHonestClaim(parent: ClaimData | undefined, claim: ClaimData) {
    this.agreed.set(claimId(claim), true);
    if (parent != undefined) {
      this.counters.set(claimId(parent), claim);
    }
  }

  public isHonest(claim: ClaimData): boolean {
    return this.agreed.get(claimId(claim)) ?? false;
  }

  public honestCounter(parent: ClaimData): ClaimData | undefined {
    return this.counters.get(claimId(parent));
  }
}