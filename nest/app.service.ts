import { Injectable, Logger } from "@nestjs/common";
import { MainWalletManager } from "./evm/main.wallet.client";
import { NCRpcService } from "./9c/nc.rpc.service";
import { PublicClientManager } from "./evm/public.client";
import { KeyManager } from "./key.utils";
import { ProposerClientManager } from "./evm/proposer.client";
import { BatcherService } from "./batcher/batcher.service";
import { DeriverService } from "./deriver/deriver.service";
import { ProposerService } from "./proposer/proposer.service";

@Injectable()
export class AppService {
    constructor(
        private readonly walletManager: MainWalletManager,
        private readonly publicClientManager: PublicClientManager,
        private readonly proposeClientManager: ProposerClientManager,
        private readonly ncRpcService: NCRpcService,
        private readonly keyManager: KeyManager,
        private readonly batcherService: BatcherService,
        private readonly deriverService: DeriverService,
        private readonly proposerService: ProposerService,
    ) {
        this.register();
    }

    private readonly logger = new Logger(AppService.name);
    
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
            var txHash =await this.proposeClientManager.proposeOutputRoot(outputRoot);
            await this.publicClientManager.waitForTransactionReceipt(txHash);
        } catch (e) {
            return "Failed to propose output root\n" + e;
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

    private async register() {
        this.logger.log("Checking initialization");
        var initialized = await this.checkInitialized();
        if(initialized === true) {
            this.logger.log("Initialization check passed");
            var res = await this.startRollup();
            if(res === true) {
                this.logger.log("Rollup started");
            } else {
                this.logger.error("Failed to start rollup");
                this.logger.error(res);
            }
        } else {
            this.logger.error("Failed to initialize");
            this.logger.error(initialized);
            var res = await this.initialize();
            if(res === true) {
                this.logger.log("Initialized");
                await this.startRollup();
                if(res === true) {
                    this.logger.log("Rollup started");
                } else {
                    this.logger.error("Failed to start rollup");
                    this.logger.error(res);
                }

            } else {
                this.logger.error("Failed to initialize");
                this.logger.error(res);
            }
        }

        this.publicClientManager.watchEvmEvents({
            onEthDeposited: async (logs) => {
                for (const log of logs) {
                    this.logger.debug(`Received EthDeposited event`);
                    this.logger.debug(log.args);

                    const recipient = log.args.to;
                    const amount = log.args.amount;
                    await this.ncRpcService.mintWeth(recipient, amount);
                    this.logger.debug(`Minted WETH to ${recipient} with amount ${amount}`);
                }
            },
            onWithdrawalProven: async (logs) => {
                for (const log of logs) {
                    this.logger.debug(`Received WithdrawalProven event`);
                    this.logger.debug(log.args);
                }
            },
            onWithdrawalFinalized: async (logs) => {
                for (const log of logs) {
                    this.logger.debug(`Received WithdrawalFinalized event`);
                    this.logger.debug(log.args);
                }
            },
            onOutputProposed: async (logs) => {
                for (const log of logs) {
                    this.logger.debug(`Received OutputProposed event`);
                    this.logger.debug(log.args);
                }
            },
        });
    }
}