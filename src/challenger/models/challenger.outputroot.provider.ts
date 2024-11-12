import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";
import { Position } from "../challenger.position";

export class OutputRootProvider {
  constructor(
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
    private readonly prestateBlockIndex: bigint,
    private readonly poststateBlockIndex: bigint,
    private readonly gameDepth: number,
  ) {}

  public async get(pos: Position): Promise<string> {
    const blockNumber = await this.honestBlockNumber(pos);
    const outputProposal = await this.libplanetGraphQlService.getOutputProposal(blockNumber);
    return outputProposal.outputRoot;
  }

  private claimedBlockNumber(pos: Position): bigint {
    const traceIndex = pos.traceIndex(this.gameDepth);
    const outputBlockIndex = this.prestateBlockIndex + traceIndex;
    if (outputBlockIndex > this.poststateBlockIndex) {
      return this.poststateBlockIndex;
    }

    return outputBlockIndex;
  }

  public async honestBlockNumber(pos: Position): Promise<bigint> {
    const outputBlockIndex = this.claimedBlockNumber(pos);
    const safeBlock = await this.libplanetGraphQlService.getRecentBlock();
    const safeBlockIndex = safeBlock.index;
    if (outputBlockIndex > safeBlockIndex) {
      return safeBlockIndex;
    }
    return outputBlockIndex;
  }
}