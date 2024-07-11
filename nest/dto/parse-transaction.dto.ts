export class ParseTransactionDto {
  serializedPayload: string;

  constructor(serializedPayload: string) {
    this.serializedPayload = serializedPayload;
  }
}