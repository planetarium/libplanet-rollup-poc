import { Injectable, Logger } from "@nestjs/common";
import { LibplanetGraphQLService } from "./libplanet.graphql.service";
import { randomBytes } from "crypto";

@Injectable()
export class LibplanetService {
  constructor(
    private readonly graphQlService: LibplanetGraphQLService,
  ) {
    this.init();
  }

  private readonly logger = new Logger(LibplanetService.name); 

  async init() {
    for(let i=0; i<20; i++){
      await this.graphQlService.sendSimpleTransaction(randomBytes(16).toString('hex'));
      this.logger.log(`Transaction ${i+1} sent`);
    }
  }
}