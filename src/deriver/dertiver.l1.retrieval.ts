import { Injectable } from "@nestjs/common";
import { DataStatus } from "./deriver.types";
import { Block, BlockNotFoundError } from "viem";
import { DataSource } from "./deriver.data.source";
import { EvmService } from "src/evm/evm.service";

@Injectable()
export class L1Retrieval {
    constructor(
        private readonly evmService: EvmService,
        private readonly dataSource: DataSource,
    ) {}

    l1BlockNumber: bigint = 0n;
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
        try {
            var block = await this.evmService.getBlockByNumber(this.l1BlockNumber);
            return block;
        } catch (e) {
            if(e instanceof BlockNotFoundError) {   
                return DataStatus.EOF;
            } else {
                throw e;
            }
        }
    }

    public getDatasLength(): number {
        return this.datas.length;
    }

    public getL1BlockNumber(): bigint {
        return this.l1BlockNumber;
    }

    public async advanceBlock() {
        this.l1BlockNumber++;
    }

    public setL1BlockNumber(blockNumber: bigint) {
        this.l1BlockNumber = blockNumber;
    }
}