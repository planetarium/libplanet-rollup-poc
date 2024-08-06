import { Address } from "viem";

export class WithdrawEthDto {
  privateKey: `0x${string}`;
  recipient: Address;
  amount: bigint;

  constructor(privateKey: `0x${string}`, recipient: Address, amount: bigint) {
    this.privateKey = privateKey;
    this.recipient = recipient;
    this.amount = amount;
  }
}