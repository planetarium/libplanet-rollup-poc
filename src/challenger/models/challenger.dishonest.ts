import { ClaimData, claimDataWrap, claimId, FaultDisputeGameStatus } from "../challenger.type";
import { EvmPublicService } from "src/evm/evm.public.service";
import { sha256, toHex } from "viem";
import { Logger } from "@nestjs/common";
import { Position } from "../utils/challenger.position";
import { ConfigService } from "@nestjs/config";
import { FaultDisputeGameBuilder } from "./faultdisputegame.builder";

export class ChallengerDishonest {
  constructor(
    private readonly configService: ConfigService,
    private readonly faultDisputeGameBuilder: FaultDisputeGameBuilder,
    private readonly evmPublicService: EvmPublicService,
  ){
    const disputeGameProxy = this.faultDisputeGameBuilder.build().address;
    this.CHALLENGER_ID = disputeGameProxy.slice(2, 5);
    this.logger = new Logger(`ChallengerDishonest-${this.CHALLENGER_ID}`);
  }

  private readonly CHALLENGER_ID: string;
  private readonly logger: Logger;

  private readonly logEnabled = this.configService.get('challenger.debug', false);
  private log(log: any) {
    if(this.logEnabled) {
      this.logger.debug(log);
    }
  }

  private readonly TIME_INTERVAL = this.configService.get('challenger.time_interval', 3000);

  private initialized: boolean = false;

  private splitDepth: number = 0;
  private maxDepth: number = 0;
  private maxClockDuration: bigint = 0n;

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }

    this.initialized = true;
    this.log(`Initialized`);

    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    this.splitDepth = Number(await faultDisputeGame.read.splitDepth());
    this.maxDepth = Number(await faultDisputeGame.read.maxGameDepth());
    this.maxClockDuration = await faultDisputeGame.read.maxClockDuration();
    const createdTimestamp = await faultDisputeGame.read.createdAt();

    while(this.initialized) {
      await this.delay(this.TIME_INTERVAL);

      const status = await faultDisputeGame.read.status() as FaultDisputeGameStatus;
      if(status === FaultDisputeGameStatus.IN_PROGRESS){
        const claimDataLen = await faultDisputeGame.read.claimDataLen();
        var claims: ClaimData[] = [];
        var claimIds = new Map<`0x${string}`, boolean>();
        for(let i = 0n; i < claimDataLen; i++) {
          claims.push(claimDataWrap(await faultDisputeGame.read.claimData([i])));
          claimIds.set(claimId(claims[Number(i)]), true);
        }

        if(claimDataLen === 1n) {
          const txHash = await this.attackToClaim(claims, claimIds, 0);
          if(txHash){
            await this.evmPublicService.waitForTransactionReceipt(txHash);
          }
          continue;
        }

        if(claimDataLen > 2n) {
          await this.onlyAttack(claimDataLen, claims, claimIds);
          // await this.randomClaim(claimDataLen, claims, claimIds);
        }
      } else {
        this.initialized = false;
        this.log(`Game is already resolved`);
        return;
      }
    }
  }

  private async onlyAttack(claimDataLen: bigint, claims: ClaimData[], claimIds: Map<`0x${string}`, boolean>) {
    const claimIndex = Number(claimDataLen - 1n);
    const claimData = claims[claimIndex];
    const depth = claimData.position.depth();
    if(depth == this.maxDepth) {
      this.initialized = false;
      this.log(`Already reached max depth`);
      return;
    }

    const txHash = await this.attackToClaim(claims, claimIds, claimIndex);
    if(txHash){
      await this.evmPublicService.waitForTransactionReceipt(txHash);
    }
  }

  private async randomClaim(claimDataLen: bigint, claims: ClaimData[], claimIds: Map<`0x${string}`, boolean>) {
    const claimIndex = Number(this.getRandomBit() ? claimDataLen - 1n : claimDataLen - 2n);
    const claimData = claims[claimIndex];
    const depth = claimData.position.depth();
    if(depth >= this.maxDepth - 2) {
      this.initialized = false;
      this.log(`Almost reached max depth`);
      return;
    }

    if(this.getRandomBit()){
      const txHash = await this.attackToClaim(claims, claimIds, claimIndex);
      if(txHash){
        await this.evmPublicService.waitForTransactionReceipt(txHash);
      }
    } else {
      const txHash = await this.defendToClaim(claims, claimIds, claimIndex);
      if(txHash){
        await this.evmPublicService.waitForTransactionReceipt(txHash);
      }
    }
  }

  private async attackToClaim(claims: ClaimData[], claimIds: Map<`0x${string}`, boolean>, parentClaimIndex: number){
    const publicAddress = this.faultDisputeGameBuilder.getPublicAddress();
    const parentClaimData = claims[parentClaimIndex];
    if(parentClaimData.claimant === publicAddress){
      return;
    }
    const parentClaim = parentClaimData.claim;
    const claimPosition = parentClaimData.position.attack();
    const claim = this.getClaimFromPosition(claimPosition);

    const claimId = this.getClaimId(parentClaimIndex, claimPosition, claim);
    if(claimIds.has(claimId)){
      return;
    }

    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    const txHash = await faultDisputeGame.write.attack([parentClaim, BigInt(parentClaimIndex), claim as `0x${string}`]);
    this.log(`Attack | parentClaimIndex: ${parentClaimIndex} claimDepth: ${claimPosition.depth()} claim: ${claim}`);

    return txHash;
  }

  private async defendToClaim(claims: ClaimData[], claimIds: Map<`0x${string}`, boolean>, parentClaimIndex: number){
    const parentClaimData = claims[parentClaimIndex];
    const parentClaim = parentClaimData.claim;
    const claimPosition = parentClaimData.position.defend();
    const claim = this.getClaimFromPosition(claimPosition);

    const claimId = this.getClaimId(parentClaimIndex, claimPosition, claim);
    if(claimIds.has(claimId)){
      return;
    }

    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    const txHash = await faultDisputeGame.write.defend([parentClaim, BigInt(parentClaimIndex), claim as `0x${string}`]);
    this.log(`Defend | parentClaimIndex: ${parentClaimIndex} claimDepth: ${claimPosition.depth()} claim: ${claim}`);

    return txHash;
  }

  private getClaimFromPosition(pos: Position) {
    const positionNumber = pos.getValue();
    const positionHex = positionNumber.toString(16);
    const hexLength = positionHex.length;
    const claim = `0x${'0'.repeat(64 - hexLength)}${positionHex}`;
    return claim as `0x${string}`;
  }

  private getClaimId(parentIndex: number, position: Position, claim: `0x${string}`) {
    const identifier = toHex(`${parentIndex}:${position.getValue()}:${claim}`);
    return sha256(identifier); 
  }

  private getRandomBit() {
    return Math.random() > 0.5;
  }

  private async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}