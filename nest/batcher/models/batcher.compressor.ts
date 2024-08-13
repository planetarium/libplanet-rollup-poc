export class Compressor {
    compressed: Uint8Array = new Uint8Array(0);

    public read(length: number): Uint8Array {
        const data = this.compressed.slice(0, length);
        this.compressed = this.compressed.slice(length);
        return data;
    }

    public write(data: Uint8Array): void {
        this.compressed = new Uint8Array([...this.compressed, ...data]);
    }

    public length(): number {
        return this.compressed.length;
    }
}