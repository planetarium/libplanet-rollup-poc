import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { NCModule } from './9c/nc.module';
import { AppService } from './app.service';
import { BatcherModule } from './batcher/batcher.module';
import { EvmModule } from './evm/evm.module';
import { RollupCronService } from './rollup.cron';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    NCModule,
    BatcherModule,
    EvmModule,
  ],
  controllers: [AppController],
  //providers: [AppService, RollupCronService],
  providers: [AppService],
})
export class AppModule {}
