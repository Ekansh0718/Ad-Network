import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns platform metadata instead of the starter placeholder', () => {
      expect(appController.getPlatform()).toEqual({
        name: 'Ad Network',
        status: 'online',
        dashboard: '/assets/analytics-dashboard.html',
        publisherPortal: '/assets/publisher-portal.html',
        advertiserStudio: '/assets/advertiser-studio.html',
      });
    });

    it('returns health status for runtime checks', () => {
      expect(appController.getHealth()).toEqual(
        expect.objectContaining({
          status: 'ok',
          uptime: expect.any(Number),
          timestamp: expect.any(String),
        }),
      );
    });
  });
});
