import { BadRequestException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { AdvertiserService } from './advertiser.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdvertiserService', () => {
  let service: AdvertiserService;
  const prismaService = {
    campaign: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertiserService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get(AdvertiserService);
  });

  it('creates advertiser campaigns in pending review state with targets and creative data', async () => {
    prismaService.campaign.create.mockResolvedValue({
      id: 'campaign-1',
      campaignName: 'US Mobile Launch',
      status: CampaignStatus.PENDING_REVIEW,
    });

    await expect(
      service.createCampaign('advertiser-1', {
        campaignName: 'US Mobile Launch',
        totalBudget: 100,
        dailyBudget: 10,
        maxCpc: 0.5,
        targetCountries: ['us', ' in '],
        targetDevices: ['mobile'],
        creativeType: 'image',
        creativeUrl: 'https://cdn.example.com/ad.png',
      }),
    ).resolves.toEqual({
      message: 'Campaign submitted for review',
      campaign: {
        id: 'campaign-1',
        campaignName: 'US Mobile Launch',
        status: CampaignStatus.PENDING_REVIEW,
      },
    });
    expect(prismaService.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        advertiserId: 'advertiser-1',
        totalBudget: 100,
        dailyBudget: 10,
        maxCpc: 0.5,
        targetCountries: ['US', 'IN'],
        targetDevices: ['mobile'],
        creativeType: 'image',
        creativeUrl: 'https://cdn.example.com/ad.png',
        status: CampaignStatus.PENDING_REVIEW,
      }),
    });
  });

  it('rejects a daily budget above the total budget', async () => {
    await expect(
      service.createCampaign('advertiser-1', {
        campaignName: 'Bad Budget',
        totalBudget: 10,
        dailyBudget: 20,
        maxCpc: 0.5,
        targetCountries: ['US'],
        targetDevices: ['mobile'],
        creativeType: 'image',
        creativeUrl: 'https://cdn.example.com/ad.png',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaService.campaign.create).not.toHaveBeenCalled();
  });
});
