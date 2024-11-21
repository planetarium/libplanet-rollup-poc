import { Injectable } from "@nestjs/common";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmPublicService } from "src/evm/evm.public.service";
import { EvmService } from "src/evm/evm.service";
import { KeyUtils } from "src/utils/utils.key";
import { TimeUtils } from "src/utils/utils.time";
import { EthProofUtil } from "../evm/utils/utils.eth.proof";

@Injectable()
export class PreoracleContractService {
  constructor(
    private readonly evmService: EvmService,
    private readonly evmPublicService: EvmPublicService,
    private readonly evmContractManager: EvmContractManager,
    private readonly keyUtils: KeyUtils,
  ) {}

  public async init() {
    this.fillBlockHashesContinuosly();
    return;
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

  public async sendBatchData(targetTxHash: `0x${string}`) {
    const privateKey = this.keyUtils.getPreOracleUserPrivateKey();
    const preOracleVM = this.evmContractManager.getPreOracleVM(privateKey);

    const batchProof = await this.evmService.getBatchProof(targetTxHash);
    const txHash = await preOracleVM.write.submitBatchData([
      batchProof.blockNumber,
      batchProof.rlpBlockHeader,
      batchProof.txHash,
      batchProof.rlpTxIndex,
      batchProof.rlpTxProof
    ]);
    await this.evmPublicService.waitForTransactionReceipt(txHash);

    return txHash;
  }
}