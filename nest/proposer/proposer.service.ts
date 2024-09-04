import { Injectable, Logger } from "@nestjs/common";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { DeriverService } from "nest/deriver/deriver.service";
import { Block, BlocksInfo, DataStatus } from "nest/deriver/deriver.types";
import { OutputRootProposeManager } from "nest/evm/propose.client";
import { PublicClientManager } from "nest/evm/public.client";

@Injectable()
export class ProposerService {
    constructor(
        private readonly deriverService: DeriverService,
        private readonly ncRpcService: NCRpcService,
        private readonly publicClientManager: PublicClientManager,
        private readonly outputRootProposeManager: OutputRootProposeManager,
    ) {
        this.proposeStart();
    }

    private readonly logger = new Logger(ProposerService.name);

    private readonly TIME_INTERVAL = 10000;

    proposing: boolean = false;

    latestProposedBlockIndex: bigint = 0n;

    invalidSanityCount: number = 0;

    public async proposeStart(): Promise<void> {
        if (this.proposing) {
            throw new Error("Already proposing");
        }

        this.proposing = true;

        var latestOutputRootInfo = await this.publicClientManager.getLatestOutputRoots();
        if (latestOutputRootInfo === undefined) {
            throw new Error("Failed to get latest output root info");
        }

        this.latestProposedBlockIndex = latestOutputRootInfo.l2BlockNumber!;

        this.logger.log("Proposing started");

        while(this.proposing) {
            await this.delay(this.TIME_INTERVAL);

            if(!this.deriverService.checkDeriveInit()
                || (this.deriverService.checkSanity() 
                && this.deriverService.getLatestBlockIndex() == this.latestProposedBlockIndex)) {
                this.logger.log("Proposing delayed: no new block");
                continue;
            }
            
            if(!this.deriverService.checkSanity()
                || (this.deriverService.getLatestBlockIndex() < this.latestProposedBlockIndex)) {
                this.logger.log("Proposing delayed: recovering batch datas");
                this.invalidSanityCount++;
                if(this.invalidSanityCount > 3) {
                    throw new Error("Failed to recover batch datas");
                }
                continue;
            }
            this.invalidSanityCount = 0;
            
            var res = this.deriverService.getBlocks();
            if (res === DataStatus.NotEnoughData) {
                this.logger.log("Proposing delayed: not enough data");
                continue;
            } else {
                var blocksInfo = res as BlocksInfo;
                if(!await this.checkBlocksSanity(blocksInfo.blocks)) {
                    throw new Error("Failed to check blocks sanity");
                }
                var outputRootInfo = await this.ncRpcService.getOutputRootProposalFromLocalNetwork(blocksInfo.latestBlockIndex);
                await this.outputRootProposeManager.propose(outputRootInfo);
                this.latestProposedBlockIndex = blocksInfo.latestBlockIndex;
                this.logger.log(`Proposed output root from L2 block ${outputRootInfo.blockIndex}`);
            }
        }
    }

    public async proposeStop(): Promise<void> {
        this.proposing = false;
    }

    private async checkBlocksSanity(blocks: Block[]): Promise<boolean> {
        for(var block of blocks) {
            var comparisonBlock = await this.ncRpcService.getBlockWithIndexFromLocal(block.index) as Block;

            if(comparisonBlock === undefined) {
                return false;
            }

            if(block.hash !== comparisonBlock.hash) {
                return false;
            }

            if(block.miner !== comparisonBlock.miner) {
                return false;
            }

            if(block.transactions.length !== comparisonBlock.transactions.length) {
                return false;
            }

            for(var i = 0; i < block.transactions.length; i++) {
                if(block.transactions[i].serializedPayload !== comparisonBlock.transactions[i].serializedPayload) {
                    return false;
                }
            }
        }

        return true;
    }

    private async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}