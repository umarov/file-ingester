import { Controller, Get, HttpCode, Header } from '@nestjs/common';
import { promises } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  @HttpCode(200)
  @Header('Content-Type', 'text/html')
  async index(): Promise<string> {
    const file = await promises.readFile(
      join(process.cwd(), 'public', 'index.html')
    );

    return file.toString();
  }
}
