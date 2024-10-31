export class Position {
  constructor(private value: bigint) {}

  public getValue(): bigint {
    return this.value;
  }

  public isRoot(): boolean {
    return this.value === 1n;
  }

  public depth(): number {
    return this.log2BigInt(this.value) + 1;
  }

  public attack(): Position {
    return new Position(2n * this.value);
  }

  public defend(): Position {
    return new Position(2n * (this.value + 1n));
  }

  public traceIndex(maxDepth: number): bigint {
    if (maxDepth < 1) {
      throw new Error("maxDepth must be at least 1.");
    }

    const depth = this.depth();
    if (depth > maxDepth) {
      throw new Error(`Position is too deep to trace with maxDepth ${maxDepth}.`);
    }

    return (2n ** BigInt(maxDepth - depth)) * (this.value + 1n) - 1n;
  }

  private log2BigInt(n: bigint): number {
    if (n <= 0n) {
        throw new Error("log2 is only defined for positive integers.");
    }

    let result = 0n;
    
    // Bit shifting until the number becomes 1
    while (n > 1n) {
        n = n >> 1n; // Divide by 2 using bit shift
        result += 1n;
    }

    return Number(result);
}
}