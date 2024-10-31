import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GraphQLClient } from "graphql-request";

@Injectable()
export class GraphQLClientManager {
  constructor(
    private readonly configure: ConfigService
  ) {
    var graphqlUrl = configure.get('libplanet.console.graphql.url', { infer: true })!;
    this.client = new GraphQLClient(graphqlUrl);
  }

  private client: GraphQLClient;

  async query(query: string): Promise<any> {
    return await this.client.request(query);
  }
}