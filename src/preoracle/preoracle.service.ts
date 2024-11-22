import { Injectable, Logger } from "@nestjs/common";
import { PreoracleContractService } from "./preoracle.contract.service";
import { PreoracleDbService } from "./preoracle.db.service";
import { EthProofUtil } from "src/evm/utils/utils.eth.proof";
import { blockIndexToBufferArray } from "./preoracle.types";
import { TimeUtils } from "src/utils/utils.time";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmService } from "src/evm/evm.service";

@Injectable()
export class PreoracleService {
  constructor(
    private readonly preoracleDbService: PreoracleDbService,
    private readonly preoracleContractService: PreoracleContractService,
    private readonly evmService: EvmService,
  ) {}

  private readonly logger = new Logger(PreoracleService.name);

  public async init() {
    this.preoracleContractService.init();
    await this.preoracleDbService.init();

    this.deleteUnnecessaryBlockIndexContinuously();
  }

  public async deleteUnnecessaryBlockIndexContinuously() {
    while(true) {
      const anchor = await this.evmService.getAnchor();
      const disputingStartingBlockNumbers = await this.evmService.getDisputingStartingBlockNumbers();
      var canDelete = true;
      for(const blockNumber of disputingStartingBlockNumbers) {
        if(blockNumber < anchor.l2BlockNumber) {
          canDelete = false;
          break;
        }
      }
      if(canDelete) {
        await this.preoracleDbService.deleteBlockIndexLowerThanByL2BlockNumber(Number(anchor.l2BlockNumber));
        this.logger.log(`Deleted block index lower than ${anchor.l2BlockNumber}`);
      }

      await TimeUtils.delay(60000);
    }
  }

  public async prepareDisputeStep(l2BlockNumber: bigint) {
    const blockIndex = this.preoracleDbService.getBlockIndexByL2BlockNumber(Number(l2BlockNumber));
    if(!blockIndex) {
      throw new Error(`Block index not found for L2 block number ${l2BlockNumber}`);
    }

    // todo: check hash data
    await this.preoracleContractService.sendBatchData(blockIndex.startingTransactionHash as `0x${string}`);
    if(blockIndex.startingDataIndex !== blockIndex.endingDataIndex) {
      await this.preoracleContractService.sendBatchData(blockIndex.endingTransactionHash as `0x${string}`);
    }

    return EthProofUtil.encodeArray(blockIndexToBufferArray(blockIndex));
  }
}