import { Test, TestingModule } from '@nestjs/testing';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  const analyticsService = {
    getDailyMetrics: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: analyticsService,
        },
      ],
    }).compile();

    controller = module.get(AnalyticsController);
  });

  it('passes date range filters into the analytics service', async () => {
    analyticsService.getDailyMetrics.mockResolvedValue({
      rows: [],
      totals: {},
    });

    await controller.getDailyMetrics('2026-07-01', '2026-07-21');

    expect(analyticsService.getDailyMetrics).toHaveBeenCalledWith(
      '2026-07-01',
      '2026-07-21',
    );
  });
});
