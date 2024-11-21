const { GetProof } = require('eth-proof');
const { encode } = require('eth-util-lite');

export abstract class EthProofUtil {
  public static async getBatchProof(
    rpcUrl: string,
    targetTxHash: `0x${string}`,
  ) {
    const getProof = new GetProof(rpcUrl);
    const res = await getProof.transactionProof(targetTxHash);

    const blockNumberBuffer = res.header[8];
    const blockNumber: bigint = BigInt(`0x${blockNumberBuffer.toString("hex")}`);

    const rlpBlockHeaderBuffer = encode(res.header);
    const rlpBlockHeader: `0x${string}` = `0x${rlpBlockHeaderBuffer.toString("hex")}`;

    const txHash: `0x${string}` = targetTxHash;

    const rlpTxIndexBuffer = encode(res.txIndex);
    const rlpTxIndex: `0x${string}` = `0x${rlpTxIndexBuffer.toString("hex")}`;

    const rlpTxProofBuffer = encode(res.txProof);
    const rlpTxProof: `0x${string}` = `0x${rlpTxProofBuffer.toString("hex")}`;

    return {
      blockNumber: blockNumber,
      rlpBlockHeader: rlpBlockHeader,
      txHash: txHash,
      rlpTxIndex: rlpTxIndex,
      rlpTxProof: rlpTxProof,
    }
  }

  public static encodeArray(data: Buffer[]): Buffer{
    return encode(data);
  }
}