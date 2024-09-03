import { Injectable, Logger } from "@nestjs/common";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { DeriverService } from "nest/deriver/deriver.service";
import { BlocksInfo, DataStatus } from "nest/deriver/deriver.types";
import { OutputRootProposeManager } from "nest/evm/propose.client";

@Injectable()
export class ProposerService {
    constructor(
        private readonly deriverService: DeriverService,
        private readonly ncRpcService: NCRpcService,
        private readonly outputRootProposeManager: OutputRootProposeManager,
    ) {
        this.proposeStart();
    }

    private readonly logger = new Logger(ProposerService.name);

    private readonly TIME_INTERVAL = 10000;

    proposing: boolean = false;

    public async proposeStart(): Promise<void> {
        if (this.proposing) {
            throw new Error("Already proposing");
        }

        this.proposing = true;

        this.logger.log("Proposing started");

        while(this.proposing) {
            await this.delay(this.TIME_INTERVAL);
            var res = this.deriverService.getBlocks();
            if (res === DataStatus.NotEnoughData) {
                this.logger.log("Proposing paused: not enough data");
                continue;
            } else {
                var blocksInfo = res as BlocksInfo;
                var outputRootInfo = await this.ncRpcService.getOutputRootProposalFromLocalNetwork(blocksInfo.latestBlockIndex);
                await this.outputRootProposeManager.propose(outputRootInfo);
            }
        }
    }

    public async proposeStop(): Promise<void> {
        this.proposing = false;
    }

    private async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}