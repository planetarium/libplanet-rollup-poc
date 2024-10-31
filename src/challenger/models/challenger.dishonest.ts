import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmContractManager } from "src/evm/evm.contracts";
import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";
import { ClaimData, claimDataWrap, FaultDisputeGameStatus } from "../challenger.type";
import { EvmPublicService } from "src/evm/evm.public.service";
import { parseAbiItem, parseEventLogs } from "viem";
import { Logger } from "@nestjs/common";

export class ChallengerDishonest {
  constructor(
    private readonly clientFactory: EvmClientFactory,
    private readonly contractManager: EvmContractManager,
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
    private readonly evmPublicService: EvmPublicService,
  ){ }

  private initialized: boolean = false;

  private readonly logger = new Logger(ChallengerDishonest.name);

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }

    const walletClient = await this.clientFactory.newWalletClient();
    var res = this.evmPublicService.waitForTransactionReceipt(walletClient.txHash);
    const privateKey = walletClient.privateKey;

    const faultDisputeGameFactory = this.contractManager.getFaultDisputeGameFactory(privateKey);

    this.initialized = true;

    while(this.initialized) {
      await this.delay(3000);

      const gameCount = await faultDisputeGameFactory.read.gameCount();
      if(gameCount === 0n){
        continue;
      }
      const gameIndex = gameCount - 1n;
      const gameAtIndex = await faultDisputeGameFactory.read.gameAtIndex([gameIndex]);
      const proxy = gameAtIndex[1];
      const faultDisputeGame = this.contractManager.getFaultDisputeGame(proxy, privateKey);
      const status = await faultDisputeGame.read.status() as FaultDisputeGameStatus;
      if(status === FaultDisputeGameStatus.IN_PROGRESS){
        const claimDataLen = await faultDisputeGame.read.claimDataLen();
        const claimDataIndex = claimDataLen - 1n;
        const claimDataAtIndex = await faultDisputeGame.read.claimData([claimDataIndex]);
        const claimData = claimDataWrap(claimDataAtIndex);

        const maxDepth = await faultDisputeGame.read.maxGameDepth();
        if(claimData.position.depth() == Number(maxDepth)){
          this.logger.log(`Dishonest: Step`);
          continue;
        }
        
        if(claimData.claimant !== walletClient.client.account.address){
          const claim = "0x0000000000000000000000000000000000000000000000000000000000000001";
          try {
            var isAttack = Math.random() < 0.5;
            if(claimDataIndex === 0n){
              isAttack = true;
            }
            const txHash = await faultDisputeGame.write.move([claimData.claim, claimDataIndex, claim, isAttack]);
            this.logger.log(`Dishonest: ${isAttack ? 'Attack' : 'Defend'}: ${claimData.position.getValue()}`);
            const res = await this.evmPublicService.waitForTransactionReceipt(txHash);
            if(res.logs.length > 0){
              const eventAbi = parseAbiItem('event Move(uint256 indexed parentIndex, bytes32 indexed claim, address indexed claimant)');
              const event = parseEventLogs({
                abi: [eventAbi],
                logs: res.logs
              })[0].args;
              //this.logger.log(`Move: ${event.parentIndex} ${event.claim} ${event.claimant}`);
            } 
          } catch (error) {
            this.logger.error(`Dishonest: Error: ${error}`);
          }
        }
      }
    }
  }

  private async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}