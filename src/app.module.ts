import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ApiController } from './api/api.controller';

@Module({
  imports: [],
  controllers: [ApiController, AppController]
})
export class AppModule {}
