import { Injectable } from "@nestjs/common";
import { WalletManager } from "./evm/wallet.client";
import { NCRpcService } from "./9c/nc.rpc.service";
import { PublicClientManager } from "./evm/public.client";
import { KeyManager } from "./key.utils";
import { ProposeClientManager } from "./evm/propose.client";
import { BatcherService } from "./batcher/batcher.service";
import { DeriverService } from "./deriver/deriver.service";
import { ProposerService } from "./proposer/proposer.service";

@Injectable()
export class AppService {
    constructor(
        private readonly walletManager: WalletManager,
        private readonly publicClientManager: PublicClientManager,
        private readonly proposeClientManager: ProposeClientManager,
        private readonly ncRpcService: NCRpcService,
        private readonly keyManager: KeyManager,
        private readonly batcherService: BatcherService,
        private readonly deriverService: DeriverService,
        private readonly proposerService: ProposerService,
    ) {}
    
    async checkInitialized(): Promise<string | boolean> {
        const contractDeployed = await this.publicClientManager.checkContractsDeployed();
        if (!contractDeployed) {
            return "Contracts not deployed";
        }

        const latestOutputRoot = await this.publicClientManager.getLatestOutputRoots();
        if (latestOutputRoot === undefined) {
            return "Output root not found";
        }

        return true;
    }

    async initialize(): Promise<string | boolean> {
        const contractDeployed = await this.publicClientManager.checkContractsDeployed();
        if (!contractDeployed) {
            return "Contracts not deployed";
        }

        const latestOutputRoot = await this.publicClientManager.getLatestOutputRoots();
        if (latestOutputRoot) {
            return "Already initialized";
        }

        try {
            const outputRoot = await this.ncRpcService.getOutputRootProposal(1n);
            await this.proposeClientManager.proposeOutputRoot(outputRoot);
        } catch (e) {
            return "Failed to propose output root";
        }

        return true;
    }

    async startRollup(): Promise<string | boolean> {
        const initialized = await this.checkInitialized();
        if (initialized !== true) {
            return initialized;
        }

        if (this.batcherService.getBatchingStatus()) {
            return "Batching already started";
        }

        if (this.deriverService.getDerivingStatus()) {
            return "Deriving already started";
        }

        if (this.proposerService.getProposingStatus()) {
            return "Proposing already started";
        }

        this.batcherService.batchStart();
        this.deriverService.derivateStart();
        this.proposerService.proposeStart();

        return true;
    }

    async stopRollup(): Promise<boolean> {
        this.batcherService.batchStop();
        this.deriverService.derivateStop();
        this.proposerService.proposeStop();

        return true;
    }
}