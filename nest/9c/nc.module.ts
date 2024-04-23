import { Module } from '@nestjs/common';
import { GraphQLClientService } from './graphql.client';
import { NCRpcService } from './nc.rpc.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [],
  providers: [GraphQLClientService, NCRpcService],
  exports: [NCRpcService],
})
export class NCModule {}
