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
  providers: [AppService, KeyManager],
})
export class AppModule {}
