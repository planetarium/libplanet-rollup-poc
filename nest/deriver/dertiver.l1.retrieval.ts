import { Injectable } from "@nestjs/common";
import { DataStatus } from "./deriver.types";
import { PublicClientManager } from "nest/evm/public.client";
import { Block, BlockNotFoundError } from "viem";
import { DataSource } from "./deriver.data.source";

@Injectable()
export class L1Retrieval {
    constructor(
        private readonly publicClientManager: PublicClientManager,
        private readonly dataSource: DataSource,
    ) {}

    l1BlockNumber: bigint = 20000n;
    isBlockPending: boolean = true;
    datas: Uint8Array[] = [];

    public async nextData(): Promise<Uint8Array | DataStatus> {
        if (this.datas.length === 0) {
            var next = await this.nextL1Block();
            if (next === DataStatus.EOF) {
                return DataStatus.EOF;
            } else {
                var block = next as Block;
                if(block.transactions.length > 0) {
                    this.datas = await this.dataSource.openData(block);
                }
            }
        }

        if (this.datas.length > 0) {
            return this.datas.shift() as Uint8Array;
        } else {
            return DataStatus.NotEnoughData;
        }
    }

    private async nextL1Block(): Promise<Block | DataStatus> {
        if (this.isBlockPending) {
            this.isBlockPending = false;
            
            try {
                var block = await this.publicClientManager.getBlock(this.l1BlockNumber);
                return block;
            } catch (e) {
                if(e instanceof BlockNotFoundError) {
                    return DataStatus.EOF;
                } else {
                    throw e;
                }
            }
        }

        return DataStatus.EOF
    }

    public advanceBlock() {
        if(!this.isBlockPending) {
            this.l1BlockNumber++;
            this.isBlockPending = true;
        }
    }
}