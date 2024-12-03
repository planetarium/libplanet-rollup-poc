import { Injectable, Logger } from "@nestjs/common";
import { PreoracleContractService } from "./preoracle.contract.service";
import { PreoracleDbService } from "./preoracle.db.service";
import { EthProofUtil } from "src/evm/utils/utils.eth.proof";
import { blockIndexToBufferArray } from "./preoracle.types";
import { TimeUtils } from "src/utils/utils.time";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmService } from "src/evm/evm.service";
import { EvmPublicService } from "src/evm/evm.public.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PreoracleService {
  constructor(
    private readonly preoracleDbService: PreoracleDbService,
    private readonly preoracleContractService: PreoracleContractService,
    private readonly evmService: EvmService,
    private readonly evmPublicService: EvmPublicService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(PreoracleService.name);
  private readonly useDebug = this.configService.get('preoracle.debug', false);
  private log(log: any) {
    if(this.useDebug) {
      this.logger.debug(log);
    } else {
      this.logger.log(log);
    }
  }

  public async init() {
    this.preoracleContractService.init();
    await this.preoracleDbService.init();

    this.deleteUnnecessaryBlockIndexContinuously();
  }

  public async test() {
    const testingL2BlockNumber = 11;

    // for testing purpose: test sendBatchData
    // const blockIndex = this.preoracleDbService.getBlockIndexByL2BlockNumber(testingL2BlockNumber);
    // if(!blockIndex) {
    //   throw new Error(`Block index not found for L2 block number ${testingL2BlockNumber}`);
    // }

    // if(blockIndex.startingTransactionHash !== blockIndex.endingTransactionHash) {
    //   throw new Error(`Starting and ending transaction hash are different for L2 block number ${testingL2BlockNumber}`);
    // }

    // const targetTxHash = blockIndex.startingTransactionHash as `0x${string}`;
    // const txData = await this.evmPublicService.getTransaction(targetTxHash);
    // const testingL1BlockNumber = txData.blockNumber;

    // await this.preoracleContractService.fillBlockHashes();
    // const blockHash = await this.preoracleContractService.checkBlockHashExist(testingL1BlockNumber)
    // if(blockHash !== txData.blockHash) {
    //   throw new Error(`Block hash mismatch for L1 block number ${testingL1BlockNumber}`);
    // }

    // await this.preoracleContractService.sendBatchData(targetTxHash);

    // for testing purpose: test step
    const batchIndexData = await this.prepareDisputeStep(BigInt(testingL2BlockNumber));
    const res = await this.preoracleContractService.step(
      BigInt(testingL2BlockNumber),
      0n,
      `0x${batchIndexData.toString('hex')}`,
    )
    console.log(res);
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
        this.log(`Deleted block index lower than ${anchor.l2BlockNumber}`);
      }

      await TimeUtils.delay(60000);
    }
  }

  public async prepareDisputeStep(l2BlockNumber: bigint) {
    // await this.preoracleContractService.fillBlockHashes();

    const blockIndex = this.preoracleDbService.getBlockIndexByL2BlockNumber(Number(l2BlockNumber));
    if(!blockIndex) {
      throw new Error(`Block index not found for L2 block number ${l2BlockNumber}`);
    }

    // todo: check hash data (maybe on-chain)
    await this.preoracleContractService.sendBatchData(blockIndex.startingTransactionHash as `0x${string}`);
    if(blockIndex.startingDataIndex !== blockIndex.endingDataIndex) {
      await this.preoracleContractService.sendBatchData(blockIndex.endingTransactionHash as `0x${string}`);
    }

    return EthProofUtil.encodeArray(blockIndexToBufferArray(blockIndex));
  }
}