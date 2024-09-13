import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '../..', 'public'));
  app.setBaseViewsDir(join(__dirname, '../..', 'views'));
  app.setViewEngine('hbs');
  app.use(
    session({
      secret: '79b95191e165d2f71f04f5389acf1ff965b9732c2ba92f0dde00b9441f1ee9b3',
      resave: false,
      saveUninitialized: false,
    }),
  );

  await app.listen(3000);
}
bootstrap();
