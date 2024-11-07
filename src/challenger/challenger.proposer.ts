import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmPublicService } from "src/evm/evm.public.service";
import { EvmService } from "src/evm/evm.service";
import { ProposerService } from "src/proposer/proposer.service";
import { KeyUtils } from "src/utils/utils.key";
import { fromHex } from "viem";

@Injectable()
export class ChallengerPropser {
  constructor(
    private readonly configService: ConfigService,
    private readonly contractManager: EvmContractManager,
    private readonly evmService: EvmService,
    private readonly evmPublicService: EvmPublicService,
    private readonly keyUtils: KeyUtils,
    private readonly proposerService: ProposerService,
  ){
    this.privateKey = this.keyUtils.getProposerPrivateKey();
  }

  private readonly TIME_INTERVAL = this.configService.get('proposer.time_interval', 10000) * 2;

  private readonly privateKey: `0x${string}`;

  private initialized: boolean = false;

  private readonly logger = new Logger(ChallengerPropser.name);

  private log(log: any) {
    if(this.configService.get('proposer.debug', false)) {
      this.log(log);
    }
  }

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }
    this.initialized = true;

    while(this.initialized) {
      await this.delay(this.TIME_INTERVAL);
      await this.proposeOutputRoot();
    }
  }

  private async proposeOutputRoot() {
    const faultDisputeGameFactory = this.contractManager.getFaultDisputeGameFactory(this.privateKey);

    const latestAnchor = await this.evmService.getAnchor();
    this.log(`Latest anchor: ${latestAnchor.root} ${latestAnchor.l2BlockNumber}`);
    const latestValidAnchor = await this.proposerService.getLatestValidOutputRootInfo();
    if(!latestValidAnchor) {
      this.log(`No valid anchor`);
      return;
    }
    this.log(`Latest valid anchor: ${latestValidAnchor.root} ${latestValidAnchor.l2BlockNumber}`);
    if(latestValidAnchor.l2BlockNumber <= latestAnchor.l2BlockNumber) {
      this.log(`No new anchor`);
      return;
    }
    const game = await faultDisputeGameFactory.read.games([
      latestValidAnchor.root,
      latestValidAnchor.l2BlockNumber
    ])
    const gameAddress = fromHex(game[0], 'number');
    if(gameAddress === 0) {
      this.log(`Game already exists`);
      return;
    }

    this.log(`Create game ${latestValidAnchor.root} ${latestValidAnchor.l2BlockNumber}`);
    const txHash = await faultDisputeGameFactory.write.create([latestValidAnchor.root, latestValidAnchor.l2BlockNumber]);
    await this.evmPublicService.waitForTransactionReceipt(txHash);
    this.log(`Game created: ${txHash}`);

    return txHash;
  }

  private async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}