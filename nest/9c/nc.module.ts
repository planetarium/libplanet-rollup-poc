import { Module } from '@nestjs/common';
import { GraphQLClientService } from './graphql.client';
import { NCRpcService } from './nc.rpc.service';
import { NCController } from './nc.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [NCController],
  providers: [GraphQLClientService, NCRpcService],
  exports: [NCRpcService],
})
export class NCModule {}
