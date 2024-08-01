import { Address } from "viem";

export class DepositEthDto {
  recipient: Address;
  amount: bigint;

  constructor(recipient: Address, amount: bigint) {
    this.recipient = recipient;
    this.amount = amount;
  }
}