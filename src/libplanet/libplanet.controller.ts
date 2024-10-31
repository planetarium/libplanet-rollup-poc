import { Controller, Get } from "@nestjs/common";
import { LibplanetGraphQLService } from "./libplanet.graphql.service";

@Controller("libplanet")
export class LibplanetController {
  constructor(
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
  ) {}

  @Get("recent-block")
  async getRecentBlock() {
    const res = await this.libplanetGraphQlService.getRecentBlock();
    return {
      hash: res.hash,
      index: res.index.toString(),
    }
  }
}