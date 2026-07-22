import { Test, TestingModule } from '@nestjs/testing';

import { AdvertiserController } from './advertiser.controller';
import { AdvertiserService } from './advertiser.service';

describe('AdvertiserController', () => {
  let controller: AdvertiserController;
  const advertiserService = {
    createCampaign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertiserController],
      providers: [
        {
          provide: AdvertiserService,
          useValue: advertiserService,
        },
      ],
    }).compile();

    controller = module.get(AdvertiserController);
  });

  it('passes the authenticated advertiser id into campaign creation', async () => {
    const dto = {
      campaignName: 'US Mobile Launch',
      totalBudget: 100,
      dailyBudget: 10,
      maxCpc: 0.5,
      targetCountries: ['US'],
      targetDevices: ['mobile'],
      creativeType: 'image',
      creativeUrl: 'https://cdn.example.com/ad.png',
    };

    advertiserService.createCampaign.mockResolvedValue({
      campaign: { id: 'campaign-1' },
    });

    await controller.createCampaign(
      { user: { id: 'advertiser-1' } },
      dto,
    );

    expect(advertiserService.createCampaign).toHaveBeenCalledWith(
      'advertiser-1',
      dto,
    );
  });
});
