import { Module } from '@nestjs/common';
import { GraphQLClientService } from './graphql.client';
import { NCRpcService } from './nc.rpc.service';
import { NCController } from './nc.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { KeyManager } from 'nest/key.utils';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [NCController],
  providers: [GraphQLClientService, NCRpcService, KeyManager],
  exports: [NCRpcService],
})
export class NCModule {}
