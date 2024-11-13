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

  public indexAtDepth(): bigint {
    const depth = this.depth();
    if (depth < 0) {
      throw new Error("depth must be at least 0.");
    }

    return this.value - ((2n ** BigInt(depth)) - 1n);
  }

  public traceIndex(maxDepth: number): bigint {
    if (maxDepth < 1) {
      throw new Error("maxDepth must be at least 1.");
    }

    const depth = this.depth();
    if (depth > maxDepth) {
      throw new Error(`Position is too deep to trace with maxDepth ${maxDepth}.`);
    }

    const p1 = BigInt(maxDepth - depth);
    const p2 = 2n ** p1;
    const p3 = p2 * (this.value + 1n);
    const p4 = 2n ** BigInt(maxDepth - 1);
    return p3 - p4;
  }

  public traceIndexFromSplitDepth(splitDepth: number, maxDepth: number) {
    if (splitDepth < 1) {
      throw new Error("splitDepth must be at least 1.");
    }

    if (maxDepth < 1) {
      throw new Error("maxDepth must be at least 1.");
    }

    if (splitDepth > maxDepth) {
      throw new Error("splitDepth must be less than or equal to maxDepth.");
    }

    const depth = this.depth();
    if (depth > maxDepth) {
      throw new Error(`Position is too deep to trace with maxDepth ${maxDepth}.`);
    }

    return {
      upperTraceIndex: this.traceIndex(maxDepth) / this.leafCountAtDepth(maxDepth - splitDepth + 1),
      lowerTraceIndex: this.traceIndex(maxDepth) % this.leafCountAtDepth(maxDepth - splitDepth + 1),
    }
  }

  private leafCountAtDepth(depth: number): bigint {
    if (depth < 0) {
      throw new Error("depth must be at least 0.");
    }

    return 2n ** BigInt(depth - 1);
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