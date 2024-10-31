import { Injectable } from "@nestjs/common";
import { EvmClientFactory } from "./evm.client.factory";
import { Address } from "viem";

@Injectable()
export class EvmPublicService {
  constructor(
    private readonly clientFactory: EvmClientFactory,
  ) {}

  private readonly client = this.clientFactory.newPublicClient();

  public async getBalance(address: Address) {
    return await this.client.getBalance({
      address: address,
    });
  }

  public async waitForTransactionReceipt(hash: `0x${string}`) {
    return await this.client.waitForTransactionReceipt({
      hash: hash,
    });
  }
}