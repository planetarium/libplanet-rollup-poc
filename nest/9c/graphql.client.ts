import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';

@Injectable()
export class GraphQLClientService {
  constructor(private readonly configure: ConfigService) {
    this.client = new GraphQLClient(configure.get('9c.rpc', { infer: true })!);
  }

  private client: GraphQLClient;

  async query(query: string): Promise<any> {
    return await this.client.request(query);
  }
}
