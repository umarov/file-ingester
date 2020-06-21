import { Controller, Get, Res, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { FastifyRequest, FastifyReply } from 'fastify';
import { parseCsv } from './worker/file-ingester'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  index(@Res() res): void {
    res.status(200).sendFile('index.html');
  }

  @Post()
  post(@Req() req: FastifyRequest, @Res() res: FastifyReply<Response>): void {
    req.multipart(
      async (field, file, filename, encoding, mimetype) => {
        await parseCsv(file)
      },
      err => {
        if (err) {
          res.status(400).send(err)
        } else {
          res.status(200).send({ message: 'File has been uploaded' })
        }
      }
    );
  }
}
