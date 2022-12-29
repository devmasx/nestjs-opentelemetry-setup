import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('E2e test', () => {
    [['/', 200, { success: true }]].forEach(
      ([endpoint, expectedStatus, expectedBody]: any) => {
        it(`GET ${endpoint}`, async () => {
          const response = await request(app.getHttpServer()).get(endpoint);
          expect(response.statusCode).toEqual(expectedStatus);
          expect(response.body.jwtData).toEqual(expectedBody);
        });
      },
    );
  });
});
