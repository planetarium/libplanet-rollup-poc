import { Controller, Get } from "@nestjs/common";
import { LibplanetService } from "./libplanet.service";

@Controller("libplanet")
export class LibplanetController {
  constructor(
    private readonly libplanetService: LibplanetService,
  ) {}

  @Get("recent-block")
  async getRecentBlock() {
    const res = await this.libplanetService.getRecentBlock();
    return {
      hash: res.hash,
      index: res.index.toString(),
    }
  }

  @Get("send-bulk-transactions")
  async sendBulkTransactions() {
    await this.libplanetService.sendBulkTransactions();
    return "OK";
  }
}