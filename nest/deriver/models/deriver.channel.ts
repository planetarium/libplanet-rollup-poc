import { ChannelID, Frame } from "../deriver.types";

export class Channel {
    id: ChannelID;
    inputs: Map<number, Frame> = new Map();
    closed: boolean = false;
    endFrameNumber: number = -1;

    constructor(id: ChannelID) {
        this.id = id;
    }

    public addFrame(frame: Frame): void {
        if (Buffer.compare(this.id, frame.id) !== 0) {
            throw new Error("Frame ID does not match channel ID");
        }
        if (this.inputs.has(frame.frameNumber)) {
            throw new Error("Frame already exists");
        }
        if (frame.isLast && this.closed) {
            throw new Error("Channel is closed");
        }
        this.inputs.set(frame.frameNumber, frame);
        if (frame.isLast) {
            this.closed = true;
            this.endFrameNumber = frame.frameNumber;
        }
    }

    public isReady(): boolean {
        if (!this.closed 
            || this.inputs.size == 0
            || this.endFrameNumber == -1) {
            return false;
        }

        if (this.inputs.size == this.endFrameNumber + 1) {
            return true;
        }

        for (var i = 0; i <= this.endFrameNumber; i++) {
            if (!this.inputs.has(i)) {
                return false;
            }
        }

        return true;
    }

    public reader(): Uint8Array {
        if (!this.isReady()) {
            throw new Error("Channel is not ready");
        }
    
        var data: Uint8Array[] = [];
        for (var i = 0; i <= this.endFrameNumber; i++) {
            var frame = this.inputs.get(i);
            if (!frame) {
                throw new Error("Frame not found");
            }
    
            data.push(frame.data);
        }
    
        return new Uint8Array(data.flatMap(a => Array.from(a)));
    }
}