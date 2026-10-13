import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionFilter } from './common/filters/all-exception.filter.js';
import { RequestDurationInterceptor } from './common/interceptors/request-duration.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const httpAdapterHost = app.get(HttpAdapterHost)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties that aren't part of the DTO
      forbidNonWhitelisted: true, // reject unexpected properties before reaching to service
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new RequestDurationInterceptor(),
  );
  
  app.useGlobalFilters(
    new AllExceptionFilter(httpAdapterHost)
  );

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
