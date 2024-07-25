import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient, Variables } from 'graphql-request';

@Injectable()
export class GraphQLClientService {
  constructor(private readonly configure: ConfigService) {
    this.client = new GraphQLClient(configure.get('9c.rpc', { infer: true })!);
    this.explorerClient = new GraphQLClient(configure.get('9c.explorer', { infer: true })!);
    this.localExplorerClient = new GraphQLClient(configure.get('local.explorer', { infer: true })!);
  }

  private client: GraphQLClient;
  private explorerClient: GraphQLClient;
  private localExplorerClient: GraphQLClient;

  async query(query: string): Promise<any> {
    return await this.client.request(query);
  }

  async explorerQuery(query: string): Promise<any> {
    return await this.explorerClient.request(query);
  }

  async localExplorerQuery(query: string): Promise<any> {
    return await this.localExplorerClient.request(query);
  }
}
