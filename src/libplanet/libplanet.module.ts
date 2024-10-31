import { Module } from "@nestjs/common";
import { LibplanetGraphQLService } from "./libplanet.graphql.service";
import { LibplanetController } from "./libplanet.controller";
import { GraphQLClientManager } from "./libplanet.graphql.client.manager";
import { LibplanetService } from "./libplanet.service";

@Module({
  imports: [],
  controllers: [LibplanetController],
  providers: [GraphQLClientManager, LibplanetGraphQLService, LibplanetService],
  exports: [LibplanetGraphQLService]
})
export class LibplanetModule {}