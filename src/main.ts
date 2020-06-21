import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import * as multiPart from 'fastify-multipart';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  app.register(multiPart);

  await app.listen(parseInt(process.env.PORT || '3000'), process.env.NODE_HOST);
}

bootstrap();
