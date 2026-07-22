import { BadRequestException, Injectable } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';

import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdvertiserService {
  constructor(private readonly prisma: PrismaService) {}

  async createCampaign(advertiserId: string, dto: CreateCampaignDto) {
    if (dto.dailyBudget > dto.totalBudget) {
      throw new BadRequestException('DAILY_BUDGET_EXCEEDS_TOTAL_BUDGET');
    }

    if (dto.creativeType === 'image' && !dto.creativeUrl) {
      throw new BadRequestException('CREATIVE_URL_REQUIRED');
    }

    if (dto.creativeType === 'html' && !dto.creativeHtml) {
      throw new BadRequestException('CREATIVE_HTML_REQUIRED');
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        advertiserId,
        campaignName: dto.campaignName,
        totalBudget: dto.totalBudget,
        dailyBudget: dto.dailyBudget,
        maxCpc: dto.maxCpc,
        targetCountries: this.normalizeList(dto.targetCountries),
        targetDevices: this.normalizeList(dto.targetDevices).map((device) =>
          device.toLowerCase(),
        ),
        creativeType: dto.creativeType,
        creativeUrl: dto.creativeUrl,
        creativeHtml: dto.creativeHtml,
        status: CampaignStatus.PENDING_REVIEW,
      },
    });

    return {
      message: 'Campaign submitted for review',
      campaign,
    };
  }

  private normalizeList(values: string[]) {
    return values
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => value.toUpperCase());
  }
}
