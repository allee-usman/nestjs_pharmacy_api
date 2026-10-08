import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ConfigService } from '@nestjs/config';
import { AllExceptionFilter } from './common/filters/all-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const configService = app.get(ConfigService)
  const httpAdapterHost = app.get(HttpAdapterHost)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties that aren't part of the DTO
      forbidNonWhitelisted: true, // reject unexpected properties before reaching to service
      transform: true,
    }),
  );

  
  app.useGlobalFilters(
    new HttpExceptionFilter(configService),
    new AllExceptionFilter(httpAdapterHost)
  );

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
