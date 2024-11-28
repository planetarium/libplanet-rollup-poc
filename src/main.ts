import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FileLogger } from './file-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new FileLogger(),
  });
  await app.listen(3000);
}
bootstrap();
