import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateAdZoneDto } from './dto/create-ad-zone.dto';
import { ValidateDomainDto } from './dto/validate-domain.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublisherService {
  constructor(private readonly prisma: PrismaService) {}

  async validateDomain(publisherId: string, dto: ValidateDomainDto) {
    const domain = this.normalizeDomain(dto.domain);
    const adsTxtUrl = `https://${domain}/ads.txt`;
    const expectedText =
      dto.expectedText?.trim() || `adnetwork-verify=${publisherId}`;
    const response = await fetch(adsTxtUrl);

    if (!response.ok) {
      throw new BadRequestException('ADS_TXT_NOT_FOUND');
    }

    const adsTxt = await response.text();
    const verified = adsTxt.includes(expectedText);

    if (!verified) {
      throw new BadRequestException('ADS_TXT_VERIFICATION_TEXT_MISSING');
    }

    return this.prisma.publisherSite.upsert({
      where: {
        publisherId_domain: {
          publisherId,
          domain,
        },
      },
      update: {
        adsTxtUrl,
        expectedText,
        verified: true,
        verifiedAt: new Date(),
      },
      create: {
        publisherId,
        domain,
        adsTxtUrl,
        expectedText,
        verified: true,
        verifiedAt: new Date(),
      },
    });
  }

  async createAdZone(publisherId: string, dto: CreateAdZoneDto) {
    const zone = await this.prisma.adZone.create({
      data: {
        publisherId,
        zoneName: dto.zoneName,
        width: dto.width,
        height: dto.height,
        layoutType: dto.layoutType,
      },
    });

    return {
      zone,
      snippet: this.buildSnippet(zone.id),
    };
  }

  buildSnippet(zoneId: string) {
    const tagUrl =
      process.env.PUBLIC_TAG_URL ??
      'http://localhost:3000/assets/publisher_tag.js';

    return `<section data-zone-id="${zoneId}"></section>\n<script async src="${tagUrl}"></script>`;
  }

  private normalizeDomain(domain: string) {
    return domain
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }
}
