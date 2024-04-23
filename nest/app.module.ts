import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WalletManager } from './wallet.client';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { NCModule } from './9c/nc.module';
import { RollupCronService } from './rollup.cron';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    NCModule,
  ],
  controllers: [AppController],
  providers: [WalletManager, RollupCronService],
})
export class AppModule {}
