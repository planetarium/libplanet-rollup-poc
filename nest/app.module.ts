import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { WalletManager } from './wallet.client';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { NCModule } from './9c/nc.module';
import { PublicClientManager } from './public.client';
import { RollupCronService } from './rollup.cron';
import { KeyManager } from './key.utils';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    NCModule,
  ],
  controllers: [AppController],
  providers: [WalletManager, PublicClientManager, RollupCronService, KeyManager, AppService],
  //providers: [WalletManager, PublicClientManager, KeyManager, AppService],
})
export class AppModule {}
