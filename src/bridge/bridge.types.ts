export type OutputRootProof = {
  stateRoot: `0x${string}`;
  storageRoot: `0x${string}`;
}

export type WithdrawalTransaction = {
  nonce: bigint;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
}