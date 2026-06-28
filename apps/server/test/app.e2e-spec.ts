/// <reference types="jest" />
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import type { Test as SuperTest } from 'supertest';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', (): void => {
  let app: INestApplication<App>;
  beforeEach(async (): Promise<void> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  it('/ (GET)', (): SuperTest => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
