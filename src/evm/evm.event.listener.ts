import { Injectable, Logger } from "@nestjs/common";
import { EvmContractManager } from "./evm.contracts";

@Injectable()
export class EvmEventListener {
  constructor(
    private readonly contractManager: EvmContractManager,
  ) {
    this.listen();
  }

  private readonly logger = new Logger(EvmEventListener.name);

  private async listen() {
    const faultDisputeGameFactory = this.contractManager.getFaultDisputeGameFactoryReader();
    const unwatch = faultDisputeGameFactory.watchEvent.FaultDisputeGameCreated({
      onLogs: async (logs) => {
        for (const log of logs) {
          this.logger.log("New game created");
          this.logger.log(log.args);
        }
      }
    })
  }
}