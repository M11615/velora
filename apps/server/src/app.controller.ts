import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller({ path: 'app', version: '1' })
export class AppController {
  constructor(private readonly appService: AppService) { };

  @Get('get-hello')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getHello(): Promise<string> {
    return await this.appService.getHello();
  };
};
