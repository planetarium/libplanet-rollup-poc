import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { NCModule } from './9c/nc.module';
import { AppService } from './app.service';
import { BatcherModule } from './batcher/batcher.module';
import { EvmModule } from './evm/evm.module';
import { KeyManager } from './key.utils';
import { DeriverModule } from './deriver/deriver.module';
import { ProposerModule } from './proposer/proposer.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    NCModule,
    EvmModule,
    BatcherModule,
    DeriverModule,
    ProposerModule,
  ],
  controllers: [AppController],
  providers: [AppService, KeyManager],
})
export class AppModule {}
