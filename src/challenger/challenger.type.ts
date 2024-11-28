import { sha256, toHex } from "viem"
import { Position } from "./utils/challenger.position"

export enum FaultDisputeGameStatus {
  // The game is currently in progress, and has not been resolved.
  IN_PROGRESS,
  // The game has concluded, and the `rootClaim` was challenged successfully.
  CHALLENGER_WINS,
  // The game has concluded, and the `rootClaim` could not be contested.
  DEFENDER_WINS
}

export type ClaimData = {
  parentIndex: number,
  counteredBy: `0x${string}`,
  claimant: `0x${string}`,
  bond: bigint,
  claim: `0x${string}`,
  position: Position,
  clock: bigint,
}

export function claimId(claimData: ClaimData): `0x${string}` {
  const identifier = toHex(`${claimData.parentIndex}:${claimData.position.getValue()}:${claimData.claim}`);
  return sha256(identifier); 
}

export function claimDataWrap(data: readonly [number, `0x${string}`, `0x${string}`, bigint, `0x${string}`, bigint, bigint]): ClaimData {
  return {
    parentIndex: data[0],
    counteredBy: data[1],
    claimant: data[2],
    bond: data[3],
    claim: data[4],
    position: new Position(data[5]),
    clock: data[6],
  }
}