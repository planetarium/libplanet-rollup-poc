import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { NCModule } from './9c/nc.module';
import { AppService } from './app.service';
import { BatcherModule } from './batcher/batcher.module';
import { EvmModule } from './evm/evm.module';
import { RollupCronService } from './rollup.cron';
import { AppGateway } from './app.gateway';
import { KeyManager } from './key.utils';
import { DeriverModule } from './deriver/deriver.module';

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
  ],
  controllers: [AppController],
  //providers: [AppService, AppGateway, KeyManager, RollupCronService],
  providers: [AppService, AppGateway, KeyManager],
})
export class AppModule {}
