export type DepositEthDto = {
  receipient: `0x${string}`;
  amount: string;
}

export type WithdrawEthDto = {
  receipient: `0x${string}`;
  amount: string;
}

export type ProveWithdrawalDto = {
  txId: `0x${string}`;
}

export type FinalizeWithdrawalDto = {
  txId: `0x${string}`;
  proofSubmitter: `0x${string}`;
}