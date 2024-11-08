export class ClaimClock {
  constructor(
    private readonly clock: bigint,
  ) {}

  public duration(): bigint {
    return this.clock >> 64n;
  }

  public timestamp(): bigint {
    return this.clock & 0xFFFFFFFFFFFFFFFFn;
  }
}