import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Address } from "viem";
import { privateKeyToAddress } from "viem/accounts";

@Injectable()
export class KeyUtils {
  constructor(
    private readonly config: ConfigService,
  ) {}

  public getMainAddress(): Address {
    return privateKeyToAddress(this.getMainPrivateKey());
  }

  public getMainPrivateKey(): `0x${string}` {
    const chain = this.config.get("evm.chain") ?? "local_geth";
    const config_key = `evm.${chain}.private_key.main`;
    return this.config.get(config_key) ?? "0x";
  }

  public getBatcherAddress(): Address {
    return privateKeyToAddress(this.getBatcherPrivateKey());
  }

  public getBatcherPrivateKey(): `0x${string}` {
    const chain = this.config.get("evm.chain") ?? "local_geth";
    const config_key = `evm.${chain}.private_key.batcher`;
    return this.config.get(config_key) ?? "0x";
  }

  public getBatchInboxAddress(): Address {
    const chain = this.config.get("evm.chain") ?? "local_geth";
    const config_key = `evm.${chain}.addresses.batch_inbox`;
    return this.config.get(config_key) ?? "0x";
  }

  public getProposerPrivateKey(): `0x${string}` {
    const chain = this.config.get("evm.chain") ?? "local_geth";
    const config_key = `evm.${chain}.private_key.proposer`;
    return this.config.get(config_key) ?? "0x";
  }
}