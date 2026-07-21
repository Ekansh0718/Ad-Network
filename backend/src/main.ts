import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse Cookies
  app.use(cookieParser());

  // Publisher-facing static assets.
  app.use('/assets', express.static(join(process.cwd(), 'public')));

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Start Server
  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 Server running at http://localhost:${process.env.PORT ?? 3000}`);
}

bootstrap();
