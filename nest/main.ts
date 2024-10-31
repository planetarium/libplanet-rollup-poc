import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import session from 'express-session';
import { SESSION_SECRET, SESSION_STORE } from './session.const';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '../..', 'public'));
  app.setBaseViewsDir(join(__dirname, '../..', 'views'));
  app.setViewEngine('hbs');

  const store = app.get(SESSION_STORE);
  app.use(
    session({
      store,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    })  
)

  await app.listen(3000);
}
bootstrap();
