import { Injectable } from "@nestjs/common";
import { Block } from "./batcher.model";

@Injectable()
export class ChannelManager {
    constructor() {}

    private blocks: Block[] = [];

    public getBlocks(): Block[] {
        return this.blocks;
    }

    public addBlock(block: Block): void {
        this.blocks.push(block);
    }
}