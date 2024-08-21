export class Compressor {
    compressed: Uint8Array = new Uint8Array(0);

    public read(length: number): Uint8Array {
        const data = this.compressed.slice(0, length);
        this.compressed = this.compressed.slice(length);
        return data;
    }

    public write(data: Uint8Array): void {
        const dataLength = data.byteLength;
        const dataLengthBytes = new Uint8Array(4);
        dataLengthBytes[0] = (dataLength >> 24) & 0xff;
        dataLengthBytes[1] = (dataLength >> 16) & 0xff;
        dataLengthBytes[2] = (dataLength >> 8) & 0xff;
        dataLengthBytes[3] = dataLength & 0xff;
        data = new Uint8Array([...dataLengthBytes, ...data]); 
        this.compressed = new Uint8Array([...this.compressed, ...data]);
    }
    
    public length(): number {
        return this.compressed.length;
    }
}