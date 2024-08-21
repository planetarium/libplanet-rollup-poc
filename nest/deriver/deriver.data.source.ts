import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Address } from "viem";

@Injectable()
export class DataSource {
    constructor(
        private readonly configure: ConfigService
    ) {}

    // todo: get from config
    batcherAddress: Address = '0xCE70F2e49927D431234BFc8D439412eef3a6276b';
    batchInboxAddress: Address = this.configure.get('local_contract_address.libplanet_batch_inbox') as Address;
}