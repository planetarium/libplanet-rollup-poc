import { Injectable } from "@nestjs/common";
import { ChainManager } from "./evm.chains";
import { Account, Address, Chain, ChainContract, Client, getContract } from "viem";
import { FaultDisputeGameFactoryAbi } from "./abis/FaultDisputeGameFactory.abi";
import { FaultDisputeGameAbi } from "./abis/FaultDisputeGame.abi";
import { EvmClientFactory } from "./evm.client.factory";
import { AnchorStateRegistryAbi } from "./abis/AnchorStateRegistry.abi";
import { PreOracleVMAbi } from "./abis/PreOracleVM.abi";

@Injectable()
export class EvmContractManager {
  constructor(
    private readonly chainMangager: ChainManager,
    private readonly clientFactory: EvmClientFactory,
  ) {}

  public getFaultDisputeGameFactoryReader() {
    const publicClient = this.clientFactory.newPublicClient();
    return getContract({
      address: (this.chainMangager.getChain().contracts?.faultDisputeGameFactory as ChainContract).address,
      abi: FaultDisputeGameFactoryAbi,
      client: publicClient
    })
  }

  public getFaultDisputeGameFactory(privateKey: `0x${string}`) {
    const publicClient = this.clientFactory.newPublicClient();
    const walletClient = this.clientFactory.getWalletClient(privateKey);
    return getContract({
      address: (this.chainMangager.getChain().contracts?.faultDisputeGameFactory as ChainContract).address,
      abi: FaultDisputeGameFactoryAbi,
      client: {
        public: publicClient,
        wallet: walletClient,
      }
    })
  }

  public getFaultDisputeGameReader(address: Address) {
    const publicClient = this.clientFactory.newPublicClient();
    return getContract({
      address: address,
      abi: FaultDisputeGameAbi,
      client: publicClient
    })
  }

  public getFaultDisputeGame(address: Address, privateKey: `0x${string}`) {
    const publicClient = this.clientFactory.newPublicClient();
    const walletClient = this.clientFactory.getWalletClient(privateKey);
    return getContract({
      address: address,
      abi: FaultDisputeGameAbi,
      client: {
        public: publicClient,
        wallet: walletClient,
      }
    })
  }

  public getAnchorStateRegistryReader() {
    const publicClient = this.clientFactory.newPublicClient();
    return getContract({
      address: (this.chainMangager.getChain().contracts?.anchorStateRegistry as ChainContract).address,
      abi: AnchorStateRegistryAbi,
      client: publicClient
    })
  }

  public getAnchorStateRegistry(privateKey: `0x${string}`) {
    const publicClient = this.clientFactory.newPublicClient();
    const walletClient = this.clientFactory.getWalletClient(privateKey);
    return getContract({
      address: (this.chainMangager.getChain().contracts?.anchorStateRegistry as ChainContract).address,
      abi: AnchorStateRegistryAbi,
      client: {
        public: publicClient,
        wallet: walletClient,
      }
    })
  }

  public getPreOracleVMReader() {
    const publicClient = this.clientFactory.newPublicClient();
    return getContract({
      address: (this.chainMangager.getChain().contracts?.preOracleVM as ChainContract).address,
      abi: PreOracleVMAbi,
      client: publicClient
    })
  }

  public getPreOracleVM(privateKey: `0x${string}`) {
    const publicClient = this.clientFactory.newPublicClient();
    const walletClient = this.clientFactory.getWalletClient(privateKey);
    return getContract({
      address: (this.chainMangager.getChain().contracts?.preOracleVM as ChainContract).address,
      abi: PreOracleVMAbi,
      client: {
        public: publicClient,
        wallet: walletClient,
      }
    })
  }
}