import { Injectable, Logger } from "@nestjs/common";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmPublicService } from "src/evm/evm.public.service";
import { EvmService } from "src/evm/evm.service";
import { KeyUtils } from "src/utils/utils.key";
import { TimeUtils } from "src/utils/utils.time";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PreoracleContractService {
  constructor(
    private readonly evmService: EvmService,
    private readonly evmPublicService: EvmPublicService,
    private readonly evmContractManager: EvmContractManager,
    private readonly keyUtils: KeyUtils,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(PreoracleContractService.name);
  private readonly useDebug = this.configService.get('preoracle.debug', false);
  private log(log: any) {
    if(this.useDebug) {
      this.logger.debug(log);
    } else {
      this.logger.log(log);
    }
  }
  private error(log: any) {
    this.logger.error(log);
  }

  public async init() {
    this.fillBlockHashesContinuosly();
    return;
  }

  public async test() {
    const privateKey = this.keyUtils.getPreOracleUserPrivateKey();
    const preOracleVM = this.evmContractManager.getPreOracleVM(privateKey);

    return;
  }

  public async checkBlockHashExist(blockNumber: bigint) {
    const preOracleVMReader = this.evmContractManager.getPreOracleVMReader();
    return await preOracleVMReader.read.blockHashes([blockNumber]);
  }

  public async fillBlockHashes() {
    const privateKey = this.keyUtils.getPreOracleUserPrivateKey();
    const preOracleVM = this.evmContractManager.getPreOracleVM(privateKey);

    const txHash = await preOracleVM.write.fillBlockHashes({
      gas: 10000000n,
    });
    await this.evmPublicService.waitForTransactionReceipt(txHash);
  }

  private async fillBlockHashesContinuosly() {
    const privateKey = this.keyUtils.getPreOracleUserPrivateKey();
    const preOracleVM = this.evmContractManager.getPreOracleVM(privateKey);

    while(true) {
      const txHash = await preOracleVM.write.fillBlockHashes({
        gas: 10000000n,
      });
      await this.evmPublicService.waitForTransactionReceipt(txHash);
      await TimeUtils.delay(60000);
    }
  }

  public async estimateGasSendBatchData(targetTxHash: `0x${string}`) {
    const privateKey = this.keyUtils.getPreOracleUserPrivateKey();
    const preOracleVM = this.evmContractManager.getPreOracleVM(privateKey);

    const batchExist = await preOracleVM.read.batchDataSubmitted([targetTxHash]);
    if(batchExist) {
      return;
    }

    const batchProof = await this.evmService.getBatchProof(targetTxHash);
    this.log(`sendBatchData`);
    try {
      const gas = await preOracleVM.estimateGas.submitBatchData([
        batchProof.blockNumber,
        batchProof.rlpBlockHeader,
        batchProof.txHash,
        batchProof.rlpTxIndex,
        batchProof.rlpTxProof
      ]);
      this.log(`sendBatchData: gas: ${gas}`);
    } catch(e) {
      this.error(e);
    }

    return;
  }

  public async sendBatchData(targetTxHash: `0x${string}`) {
    const privateKey = this.keyUtils.getPreOracleUserPrivateKey();
    const preOracleVM = this.evmContractManager.getPreOracleVM(privateKey);

    const batchExist = await preOracleVM.read.batchDataSubmitted([targetTxHash]);
    if(batchExist) {
      return;
    }

    const batchProof = await this.evmService.getBatchProof(targetTxHash);
    this.log(`sendBatchData`);
    try {
      const txHash = await preOracleVM.write.submitBatchData([
        batchProof.blockNumber,
        batchProof.rlpBlockHeader,
        batchProof.txHash,
        batchProof.rlpTxIndex,
        batchProof.rlpTxProof
      ]);
      const txReceipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
      this.log(`sendBatchData: txReceipt: ${txReceipt.status}`);
    } catch(e) {
      this.error(e);
    }

    return;
  }

  public async step(
    blockNumber: bigint,
    transactionIndex: bigint,
    batchIndexData: `0x${string}`
  ) {
    const privateKey = this.keyUtils.getPreOracleUserPrivateKey();
    const preOracleVM = this.evmContractManager.getPreOracleVM(privateKey);

    const res = await preOracleVM.read.step([
      this.getClaimFromNumber(Number(blockNumber)),
      blockNumber,
      transactionIndex,
      batchIndexData
    ])

    return res;
  }

  private getClaimFromNumber(positionNumber: number) {
    const positionHex = positionNumber.toString(16);
    const hexLength = positionHex.length;
    const claim = `0x${'0'.repeat(64 - hexLength)}${positionHex}`;
    return claim as `0x${string}`;
  }
}