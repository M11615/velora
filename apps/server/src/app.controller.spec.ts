/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { AppController } from './app.controller';

describe('AppController', (): void => {
  let appController: AppController;
  beforeEach(async (): Promise<void> => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [AppService],
      controllers: [AppController]
    }).compile();
    appController = app.get<AppController>(AppController);
  });
  describe('root', (): void => {
    it('should return "Hello World!"', (): void => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
