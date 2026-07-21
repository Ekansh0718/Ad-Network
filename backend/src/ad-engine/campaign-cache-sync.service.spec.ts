import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import {
  CAMPAIGN_CACHE_STORE,
  CampaignCacheSyncService,
} from './campaign-cache-sync.service';
import { CampaignCacheStore } from './campaign-cache.types';
import { PrismaService } from '../prisma/prisma.service';

describe('CampaignCacheSyncService', () => {
  let service: CampaignCacheSyncService;
  let prismaService: {
    $queryRaw: jest.Mock;
  };
  let campaignCacheStore: jest.Mocked<CampaignCacheStore>;

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn(),
    };
    campaignCacheStore = {
      replaceActiveCampaigns: jest.fn(),
      getActiveCampaigns: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignCacheSyncService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: CAMPAIGN_CACHE_STORE,
          useValue: campaignCacheStore,
        },
      ],
    }).compile();

    service = module.get(CampaignCacheSyncService);
  });

  it('loads ACTIVE campaigns with funded advertisers into the Redis cache store', async () => {
    const activeCampaign = {
      id: 'campaign-1',
      advertiserId: 'advertiser-1',
      campaignName: 'US Mobile Banner',
      totalBudget: new Prisma.Decimal('100.00'),
      dailyBudget: new Prisma.Decimal('10.00'),
      maxCpc: new Prisma.Decimal('1.00'),
      targetCountries: ['US'],
      targetDevices: ['mobile'],
      status: 'ACTIVE',
      advertiserBalanceUsd: new Prisma.Decimal('5.00'),
    };

    prismaService.$queryRaw.mockResolvedValue([activeCampaign]);

    await expect(service.syncActiveCampaigns()).resolves.toEqual({
      cachedCampaigns: 1,
    });

    expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    expect(campaignCacheStore.replaceActiveCampaigns).toHaveBeenCalledWith([
      activeCampaign,
    ]);
  });

  it('removes a paused campaign from Redis on the next sync by replacing with an empty active list', async () => {
    prismaService.$queryRaw.mockResolvedValue([]);

    await expect(service.syncActiveCampaigns()).resolves.toEqual({
      cachedCampaigns: 0,
    });

    expect(campaignCacheStore.replaceActiveCampaigns).toHaveBeenCalledWith([]);
  });
});
