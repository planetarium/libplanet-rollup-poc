import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DeriverService } from "src/deriver/deriver.service";
import { Block, BlocksInfo, compareBlock, DataStatus } from "src/deriver/deriver.types";
import { EvmService } from "src/evm/evm.service";
import { LibplanetService } from "src/libplanet/libplanet.service";
import { OutputRootInfo } from "./proposer.type";

@Injectable()
export class ProposerService {
    constructor(
        private readonly configService: ConfigService,
        private readonly evmService: EvmService,
        private readonly libplanetService: LibplanetService,
        private readonly deriverService: DeriverService,
    ) {}

    private readonly logger = new Logger(ProposerService.name);
    private readonly useDebug = this.configService.get('proposer.debug', false);    
    private log(log: any) {
        if(this.useDebug) {
            this.logger.debug(log);
        } else {
            this.logger.log(log);
        }
    }

    private readonly TIME_INTERVAL = this.configService.get('proposer.time_interval', 10000);
    private readonly MAX_INVALID_SANITY_COUNT = this.configService.get('proposer.invalid_sanity_count', 5000);

    private proposing: boolean = false;
    private sequencerDown: boolean = false;

    private latestProposedBlockIndex: bigint = 0n;

    private invalidSanityCount: number = 0;

    private latestValidOutputRootInfo: OutputRootInfo | undefined = undefined;

    public getLatestValidOutputRootInfo(): OutputRootInfo | undefined {
        return this.latestValidOutputRootInfo;
    }

    public async proposeStart(): Promise<void> {
        if (this.proposing) {
            throw new Error("Already proposing");
        }

        this.latestValidOutputRootInfo = await this.evmService.getAnchor() as OutputRootInfo;
        if (this.latestValidOutputRootInfo === undefined) {
            throw new Error("Failed to get latest output root info");
        }

        this.latestProposedBlockIndex = this.latestValidOutputRootInfo.l2BlockNumber!;

        this.proposing = true;

        this.log("Proposing started");

        while(this.proposing) {
            await this.delay(this.TIME_INTERVAL);

            if(this.sequencerDown) {
                throw new Error("Sequencer is down");
            }

            if(!this.deriverService.checkDeriveInit()) {
                this.log("Proposing delayed: no new block");
                continue;
            }

            var deriverBlockSanity = this.deriverService.checkSanity();

            if(!deriverBlockSanity) {
                this.log("Proposing delayed: recovering batch datas");
                this.deriverService.deleteUntilBlockIndex(this.latestProposedBlockIndex);
                this.invalidSanityCount++;
                continue;
            }

            if(this.deriverService.getOldestBlockIndex() > this.latestProposedBlockIndex + 1n) {
                this.log("Proposing delayed: invalid block range");
                this.invalidSanityCount++;
                continue;
            }

            if(this.deriverService.getLatestBlockIndex() <= this.latestProposedBlockIndex) {
                this.log("Proposing delayed: no new block");
                continue;
            }
            
            var res = this.deriverService.getBlocks();
            if (res === DataStatus.NotEnoughData) {
                this.log("Proposing delayed: not enough data");
                continue;
            } else {
                var blocksInfo = res as BlocksInfo;
                blocksInfo.blocks = this.removeUnecessaryBlocks(blocksInfo.blocks, this.latestProposedBlockIndex);

                if(!await this.checkBlocksSanity(blocksInfo.blocks)) {
                    this.sequencerIsDown("Failed to check blocks sanity");
                    continue;
                }

                this.invalidSanityCount = 0;
                var outputRootInfo = await this.libplanetService.getOutputRootInfoByBlockIndex(blocksInfo.latestBlockIndex) as OutputRootInfo;
                this.latestValidOutputRootInfo = outputRootInfo;
                this.latestProposedBlockIndex = blocksInfo.latestBlockIndex;
                this.log(`Proposed output root from L3 block ${outputRootInfo.l2BlockNumber}`);
            }

            if(this.invalidSanityCount > this.MAX_INVALID_SANITY_COUNT) {
                this.sequencerIsDown("Failed to recover batch datas");
                continue;
            } else if (this.sequencerDown) {
                this.sequencerIsUp("Recovered batch datas");
            }
        }

        this.log("Proposing stopped");
    }

    private sequencerIsDown(log: string) {
        this.log(log);
        this.deriverService.deriveStop();
        this.sequencerDown = true;
    }

    private sequencerIsUp(log: string) {
        this.log(log);
        this.deriverService.deriveStart();
        this.sequencerDown = false;
    }

    public getProposingStatus(): boolean {
        return this.proposing;
    }

    public proposeStop() {
        this.proposing = false;
    }

    private removeUnecessaryBlocks(blocks: Block[], latestBlockIndex: bigint): Block[] {
        return blocks.filter(block => block.index > latestBlockIndex);
    }

    private async checkBlocksSanity(blocks: Block[]): Promise<boolean> {
        for(var block of blocks) {
            var comparisonBlock = await this.libplanetService.getBlockByIndex(block.index) as Block;

            if(comparisonBlock === undefined) {
                return false;
            }

            if(!compareBlock(block, comparisonBlock)) {
                return false;
            }
        }

        return true;
    }

    private async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}