import { Controller, Get, Res, Post, Req, Header, HttpCode } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { promises } from 'fs'
import { AppService } from './app.service';

import { parseCsv } from './worker/file-ingester'
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @HttpCode(200)
  @Header('Content-Type', 'text/html')
  async index(): Promise<string> {
    const file = await promises.readFile(join(process.cwd(), 'public', 'index.html'))

    return file.toString()
  }

  @Post()
  post(@Req() req: FastifyRequest, @Res() res: FastifyReply<Response>): void {
    const fileParts = []
    req.multipart(
      (_, file) => {
        file.on('data', (buffer) => {
          fileParts.push(buffer)
        })

        file.on('end', async () => {
          const fullFileBuffer = Buffer.concat(fileParts)

          try {
            const result = await parseCsv(fullFileBuffer)
            res.status(200).send({ message: 'File has been uploaded', values: result })
          } catch (err) {
            res.status(400).send(err)
          }
        })

      },
      err => {
        if (err) {
          console.log(err);
          res.status(400).send(err)
        }
      }
    );
  }
}
