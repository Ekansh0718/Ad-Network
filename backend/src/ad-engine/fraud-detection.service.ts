import { Injectable } from '@nestjs/common';

import { FrequencyCappingService } from './frequency-capping.service';
import { PrismaService } from '../prisma/prisma.service';

export type FraudDecision = {
  blocked: boolean;
  reason?: string;
};

@Injectable()
export class FraudDetectionService {
  private readonly blockedUserAgentPatterns = [
    /curl/i,
    /python-requests/i,
    /headlesschrome/i,
    /phantomjs/i,
    /selenium/i,
    /playwright/i,
    /puppeteer/i,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly frequencyCappingService: FrequencyCappingService,
  ) {}

  async evaluateServeRequest(
    ipAddress: string,
    userAgent?: string,
  ): Promise<FraudDecision> {
    const baseDecision = await this.evaluateBotAndBlacklist(
      ipAddress,
      userAgent,
    );

    if (baseDecision.blocked) {
      return baseDecision;
    }

    const frequencyCap = await this.frequencyCappingService.evaluateImpression(
      this.normalizeIp(ipAddress),
    );

    if (!frequencyCap.allowed) {
      return {
        blocked: true,
        reason: frequencyCap.reason,
      };
    }

    return {
      blocked: false,
    };
  }

  async evaluateClickRequest(
    ipAddress: string,
    userAgent?: string,
  ): Promise<FraudDecision> {
    const baseDecision = await this.evaluateBotAndBlacklist(
      ipAddress,
      userAgent,
    );

    if (baseDecision.blocked) {
      return baseDecision;
    }

    const frequencyCap = await this.frequencyCappingService.evaluateClick(
      this.normalizeIp(ipAddress),
    );

    if (!frequencyCap.allowed) {
      return {
        blocked: true,
        reason: frequencyCap.reason,
      };
    }

    return {
      blocked: false,
    };
  }

  private async evaluateBotAndBlacklist(
    ipAddress: string,
    userAgent?: string,
  ): Promise<FraudDecision> {
    const normalizedIp = this.normalizeIp(ipAddress);
    const blacklistEntry = await this.prisma.blacklistedIp.findUnique({
      where: { ipAddress: normalizedIp },
    });

    if (blacklistEntry) {
      return {
        blocked: true,
        reason: 'IP_BLACKLISTED',
      };
    }

    if (!userAgent || userAgent.trim().length === 0) {
      return {
        blocked: true,
        reason: 'MISSING_USER_AGENT',
      };
    }

    if (
      this.blockedUserAgentPatterns.some((pattern) => pattern.test(userAgent))
    ) {
      return {
        blocked: true,
        reason: 'SUSPICIOUS_USER_AGENT',
      };
    }

    return {
      blocked: false,
    };
  }

  async recordHoneypotHit(ipAddress: string, userAgent?: string) {
    const normalizedIp = this.normalizeIp(ipAddress);

    return this.prisma.blacklistedIp.upsert({
      where: { ipAddress: normalizedIp },
      update: {
        source: 'HONEYPOT',
        reason: this.formatReason(userAgent),
      },
      create: {
        ipAddress: normalizedIp,
        source: 'HONEYPOT',
        reason: this.formatReason(userAgent),
      },
    });
  }

  normalizeIp(ipAddress: string) {
    return ipAddress.replace('::ffff:', '').split(',')[0].trim();
  }

  private formatReason(userAgent?: string) {
    return userAgent
      ? `Hidden honeypot link requested by ${userAgent}`
      : 'Hidden honeypot link requested';
  }
}
