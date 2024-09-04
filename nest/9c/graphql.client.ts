import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient, Variables } from 'graphql-request';

@Injectable()
export class GraphQLClientService {
  constructor(private readonly configure: ConfigService) {
    var clientConfig = configure.get('graphql.client', { infer: true })!;
    this.client = new GraphQLClient(configure.get('graphql.'.concat(clientConfig), { infer: true })!);
  }

  private client: GraphQLClient;

  async query(query: string): Promise<any> {
    return await this.client.request(query);
  }
}
