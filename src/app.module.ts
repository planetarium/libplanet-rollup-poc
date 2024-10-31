import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { EvmModule } from './evm/evm.module';
import { LibplanetModule } from './libplanet/libplanet.module';
import { ChallengerModule } from './challenger/challenger.module';
import { BatcherModule } from './batcher/batcher.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
