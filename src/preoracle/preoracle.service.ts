import { Injectable } from "@nestjs/common";
import { PreoracleContractService } from "./preoracle.contract.service";
import { PreoracleDbService } from "./preoracle.db.service";
import { EthProofUtil } from "src/evm/utils/utils.eth.proof";
import { blockIndexToBufferArray } from "./preoracle.types";

@Injectable()
export class PreoracleService {
  constructor(
    private readonly preoracleDbService: PreoracleDbService,
    private readonly preoracleContractService: PreoracleContractService,
  ) {}

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