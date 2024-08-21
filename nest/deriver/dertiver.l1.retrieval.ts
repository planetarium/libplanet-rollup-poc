import { Injectable } from "@nestjs/common";
import { DataStatus } from "./deriver.types";
import { PublicClientManager } from "nest/evm/public.client";
import { Block } from "viem";

@Injectable()
export class L1Retrieval {
    constructor(
        private readonly publicClientManager: PublicClientManager,
    ) {}

    l1BlockNumber: bigint = 0n;
    isBlockPending: boolean = false;
    datas: Uint8Array[] = [];

    public async nextData(): Promise<Uint8Array | DataStatus> {
        if (this.datas.length === 0) {
            var next = await this.nextL1Block();
            if (next === DataStatus.EOF) {
                return DataStatus.EOF;
            }
        }

        return DataStatus.EOF;
    }

    private async nextL1Block(): Promise<Block | DataStatus> {
        if (this.isBlockPending) {
            this.isBlockPending = false;
            return await this.publicClientManager.GetBlock(this.l1BlockNumber);
        }

        return DataStatus.EOF
    }
}