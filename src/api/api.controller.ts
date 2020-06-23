import {
  Controller,
  Res,
  Post,
  Req
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

import { parseCsv } from './worker/file-ingester';

@Controller('api')
export class ApiController {
  @Post('process')
  process(@Req() req: FastifyRequest): any {
    return req.body
  }


  @Post('upload')
  upload(@Req() req: FastifyRequest, @Res() res: FastifyReply<Response>): void {
    const fileParts = [];
    if (!req.isMultipart()) {
      res.status(400).send({ message: 'Request needs to be a multi part' });
    } else {
      req.multipart(
        (_, file) => {
          file.on('data', (buffer) => {
            fileParts.push(buffer);
          });

          file.on('end', async () => {
            const fullFileBuffer = Buffer.concat(fileParts);

            try {
              const result = await parseCsv(fullFileBuffer);
              res
                .status(200)
                .send({ message: 'File has been uploaded', values: result });
            } catch (err) {
              res.status(400).send(err);
            }
          });
        },
        (err) => {
          if (err) {
            console.log(err);
            res.status(400).send(err);
          }
        }
      );
    }
  }
}
