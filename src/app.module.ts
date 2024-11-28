import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { EvmModule } from './evm/evm.module';
import { LibplanetModule } from './libplanet/libplanet.module';
import { ChallengerModule } from './challenger/challenger.module';
import { BatcherModule } from './batcher/batcher.module';
import { DeriverModule } from './deriver/deriver.module';
import { PreoracleModule } from './preoracle/preoracle.module';
import { ProposerModule } from './proposer/proposer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    EvmModule,
    LibplanetModule,
    ChallengerModule,
    BatcherModule,
    DeriverModule,
    ProposerModule,
    PreoracleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
