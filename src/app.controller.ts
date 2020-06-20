import { Controller, Get, Res, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { FastifyRequest } from 'fastify'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  index(@Res() res): void {
    res.status(200).sendFile('index.html')
  }

  @Post()
  post(@Req() req: FastifyRequest): void {
    console.log(req.raw);
  }
}
