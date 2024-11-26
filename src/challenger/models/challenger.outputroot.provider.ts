import { Logger } from "@nestjs/common";
import { Position } from "../utils/challenger.position";
import { LibplanetService } from "src/libplanet/libplanet.service";

export class OutputRootProvider {
  constructor(
    private readonly libplanetService: LibplanetService,
    private readonly prestateBlockIndex: bigint,
    private readonly poststateBlockIndex: bigint,
    private readonly splitDepth: number,
    private readonly maxDepth: number,
  ) {}

  private readonly logger = new Logger(OutputRootProvider.name);

  public async get(pos: Position): Promise<string> {
    if (pos.depth() <= this.splitDepth) {
      const blockNumber = await this.honestBlockNumber(pos);
      const outputRootInfo = await this.libplanetService.getOutputRootInfoByBlockIndex(blockNumber);
      return outputRootInfo.root;
    } else {
      const transactionId = await this.honestTransactionId(pos);
      if(transactionId === "") {
        const disputeNumber = await this.getDisputedNumber(pos);
        const outputRootInfo = await this.libplanetService.getOutputRootInfoByBlockIndex(disputeNumber.blockNumber - 1n);
        return outputRootInfo.root;
      }
      const outputRoot = await this.libplanetService.getOutputRootByTransactionId(transactionId);
      return outputRoot;
    }
  }

  public async getDisputedNumber(pos: Position) {
    if (pos.depth() <= this.splitDepth) {
      const blockNumber = await this.honestBlockNumber(pos);
      return {
        blockNumber: blockNumber,
        transactionNumber: -1,
      };
    } else {
      const traceIndex = pos.traceIndexFromSplitDepth(this.splitDepth, this.maxDepth);
      const upperTraceIndex = traceIndex.upperTraceIndex;
      const lowerTraceIndex = traceIndex.lowerTraceIndex;
      var transactionIndex = Number(lowerTraceIndex - 1n);
      const outputBlockIndex = this.prestateBlockIndex + upperTraceIndex;
      var safeBlockIndex = outputBlockIndex;
      if(safeBlockIndex > this.poststateBlockIndex) {
        safeBlockIndex = this.poststateBlockIndex;
      }
      const safeBlock = await this.libplanetService.getRecentBlock();
      if(safeBlock.index < safeBlockIndex) {
        safeBlockIndex = safeBlock.index;
      }
      const disputeBlock = await this.libplanetService.getBlockByIndex(safeBlockIndex, true);
      const transactions = disputeBlock.transactions as {id: string, serializedPayload: string}[];
      if(transactionIndex >= transactions.length) {
        transactionIndex = transactions.length - 1;
      }
      return {
        blockNumber: safeBlockIndex,
        transactionNumber: transactionIndex,
      };
    }
  }

  private claimedBlockNumber(pos: Position): bigint {
    const traceIndex = pos.traceIndex(this.splitDepth);
    // this.logger.debug(`depth: ${pos.depth()} traceIndex: ${traceIndex}`);
    const outputBlockIndex = this.prestateBlockIndex + traceIndex;
    if (outputBlockIndex > this.poststateBlockIndex) {
      return this.poststateBlockIndex;
    }

    return outputBlockIndex;
  }

  private async honestBlockNumber(pos: Position): Promise<bigint> {
    const outputBlockIndex = this.claimedBlockNumber(pos);
    const safeBlock = await this.libplanetService.getRecentBlock();
    const safeBlockIndex = safeBlock.index;
    if (outputBlockIndex > safeBlockIndex) {
      return safeBlockIndex;
    }
    return outputBlockIndex;
  }

  public async honestTransactionId(pos: Position): Promise<string> {
    const traceIndex = pos.traceIndexFromSplitDepth(this.splitDepth, this.maxDepth);
    const upperTraceIndex = traceIndex.upperTraceIndex;
    const lowerTraceIndex = traceIndex.lowerTraceIndex;
    // this.logger.debug(`depth: ${pos.depth()} upperTraceIndex: ${upperTraceIndex} lowerTraceIndex: ${lowerTraceIndex}`);

    var transactionIndex = Number(lowerTraceIndex - 1n);
    const outputBlockIndex = this.prestateBlockIndex + upperTraceIndex;
    var safeBlockIndex = outputBlockIndex;
    if(safeBlockIndex > this.poststateBlockIndex) {
      safeBlockIndex = this.poststateBlockIndex;
    }
    const safeBlock = await this.libplanetService.getRecentBlock();
    if(safeBlock.index < safeBlockIndex) {
      safeBlockIndex = safeBlock.index;
    }
    const disputeBlock = await this.libplanetService.getBlockByIndex(safeBlockIndex, true);
    const transactions = disputeBlock.transactions as {id: string, serializedPayload: string}[];
    if(transactionIndex >= transactions.length) {
      transactionIndex = transactions.length - 1;
    }
    if(transactionIndex < 0) {
      return "";
    }
    const disputeTransactionId = transactions[transactionIndex].id;
    return disputeTransactionId;
  }
}