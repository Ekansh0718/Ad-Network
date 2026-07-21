import { Prisma } from '@prisma/client';

export type CacheableCampaign = {
  id: string;
  advertiserId: string;
  campaignName: string;
  totalBudget: Prisma.Decimal | number | string;
  dailyBudget: Prisma.Decimal | number | string;
  maxCpc: Prisma.Decimal | number | string;
  targetCountries: string[];
  targetDevices: string[];
  status: string;
  advertiserBalanceUsd: Prisma.Decimal | number | string;
};

export type CampaignCacheRecord = {
  id: string;
  advertiserId: string;
  campaignName: string;
  totalBudget: string;
  dailyBudget: string;
  maxCpc: string;
  targetCountries: string;
  targetDevices: string;
  status: string;
  advertiserBalanceUsd: string;
};

export type ParsedCampaignCacheRecord = {
  id: string;
  advertiserId: string;
  campaignName: string;
  totalBudget: number;
  dailyBudget: number;
  maxCpc: number;
  targetCountries: string[];
  targetDevices: string[];
  status: string;
  advertiserBalanceUsd: number;
};

export interface CampaignCacheStore {
  replaceActiveCampaigns(campaigns: CacheableCampaign[]): Promise<void>;
  getActiveCampaigns(): Promise<ParsedCampaignCacheRecord[]>;
}
