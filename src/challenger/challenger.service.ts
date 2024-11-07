import { Injectable } from "@nestjs/common";
import { ChallengerPropser } from "./challenger.proposer";
import { EvmContractManager } from "src/evm/evm.contracts";
import { FaultDisputeGameStatus } from "./challenger.type";

@Injectable()
export class ChallengerService {
  constructor(
    private readonly challengerProposer: ChallengerPropser,
    private readonly evmContractManager: EvmContractManager,
  ) {}

  public async init() {
    this.challengerProposer.init();

    const faultDisputeGameFactoryReader = this.evmContractManager.getFaultDisputeGameFactoryReader();
    const gameCount = await faultDisputeGameFactoryReader.read.gameCount();
    for(let i = 0; i < gameCount; i++) {
      const gameAtIndex = await faultDisputeGameFactoryReader.read.gameAtIndex([BigInt(i)]);
      const proxy = gameAtIndex[1];

      const faultDisputeGameReader = this.evmContractManager.getFaultDisputeGameReader(proxy);
      const disputeStatus = await faultDisputeGameReader.read.status() as FaultDisputeGameStatus;
      if(disputeStatus === FaultDisputeGameStatus.IN_PROGRESS) {
        // attach honest challenger
      }
    }

    await faultDisputeGameFactoryReader.watchEvent.FaultDisputeGameCreated({
      onLogs: async (logs) => {
        if(logs.length === 0) {
          return;
        }
        if(!logs[0].args) {
          return;
        }
        const proxy = logs[0].args.faultDisputeGame;
        if(!proxy) {
          return;
        }
        const faultDisputeGameReader = this.evmContractManager.getFaultDisputeGameReader(proxy);
        const disputeStatus = await faultDisputeGameReader.read.status() as FaultDisputeGameStatus;
        if(disputeStatus === FaultDisputeGameStatus.IN_PROGRESS) {
          // attach honest challenger
        }
      }
    });
  }
}