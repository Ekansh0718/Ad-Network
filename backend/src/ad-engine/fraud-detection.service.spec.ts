import { Test, TestingModule } from '@nestjs/testing';

import { FrequencyCappingService } from './frequency-capping.service';
import { FraudDetectionService } from './fraud-detection.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;
  const prismaService = {
    blacklistedIp: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const frequencyCappingService = {
    evaluateImpression: jest.fn(),
    evaluateClick: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    frequencyCappingService.evaluateImpression.mockResolvedValue({
      allowed: true,
      key: 'rate:imp:127.0.0.1',
      count: 1,
      limit: 2,
      ttlSeconds: 30,
    });
    frequencyCappingService.evaluateClick.mockResolvedValue({
      allowed: true,
      key: 'rate:click:127.0.0.1',
      count: 1,
      limit: 3,
      ttlSeconds: 60,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudDetectionService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: FrequencyCappingService,
          useValue: frequencyCappingService,
        },
      ],
    }).compile();

    service = module.get(FraudDetectionService);
  });

  it('blocks IPs already stored in the blacklist table', async () => {
    prismaService.blacklistedIp.findUnique.mockResolvedValue({
      ipAddress: '127.0.0.1',
    });

    await expect(
      service.evaluateServeRequest('::ffff:127.0.0.1', 'Mozilla/5.0'),
    ).resolves.toEqual({
      blocked: true,
      reason: 'IP_BLACKLISTED',
    });
  });

  it('blocks missing and known automation user agents', async () => {
    prismaService.blacklistedIp.findUnique.mockResolvedValue(null);

    await expect(
      service.evaluateServeRequest('127.0.0.1', ''),
    ).resolves.toEqual({
      blocked: true,
      reason: 'MISSING_USER_AGENT',
    });
    await expect(
      service.evaluateServeRequest('127.0.0.1', 'python-requests/2.31'),
    ).resolves.toEqual({
      blocked: true,
      reason: 'SUSPICIOUS_USER_AGENT',
    });
  });

  it('allows normal browser profiles not present in the blacklist', async () => {
    prismaService.blacklistedIp.findUnique.mockResolvedValue(null);

    await expect(
      service.evaluateServeRequest('127.0.0.1', 'Mozilla/5.0 Safari/537.36'),
    ).resolves.toEqual({
      blocked: false,
    });
    expect(frequencyCappingService.evaluateImpression).toHaveBeenCalledWith(
      '127.0.0.1',
    );
  });

  it('blocks traffic after the Redis velocity cap is exceeded', async () => {
    prismaService.blacklistedIp.findUnique.mockResolvedValue(null);
    frequencyCappingService.evaluateImpression.mockResolvedValue({
      allowed: false,
      key: 'rate:imp:127.0.0.1',
      count: 3,
      limit: 2,
      ttlSeconds: 30,
      reason: 'IMPRESSION_VELOCITY_EXCEEDED',
    });

    await expect(
      service.evaluateServeRequest('127.0.0.1', 'Mozilla/5.0 Safari/537.36'),
    ).resolves.toEqual({
      blocked: true,
      reason: 'IMPRESSION_VELOCITY_EXCEEDED',
    });
  });

  it('allows normal click traffic and checks the click velocity cap, not the impression cap', async () => {
    prismaService.blacklistedIp.findUnique.mockResolvedValue(null);

    await expect(
      service.evaluateClickRequest('127.0.0.1', 'Mozilla/5.0 Safari/537.36'),
    ).resolves.toEqual({
      blocked: false,
    });
    expect(frequencyCappingService.evaluateClick).toHaveBeenCalledWith(
      '127.0.0.1',
    );
    expect(frequencyCappingService.evaluateImpression).not.toHaveBeenCalled();
  });

  it('blocks click traffic once the click velocity cap is exceeded', async () => {
    prismaService.blacklistedIp.findUnique.mockResolvedValue(null);
    frequencyCappingService.evaluateClick.mockResolvedValue({
      allowed: false,
      key: 'rate:click:127.0.0.1',
      count: 4,
      limit: 3,
      ttlSeconds: 60,
      reason: 'CLICK_VELOCITY_EXCEEDED',
    });

    await expect(
      service.evaluateClickRequest('127.0.0.1', 'Mozilla/5.0 Safari/537.36'),
    ).resolves.toEqual({
      blocked: true,
      reason: 'CLICK_VELOCITY_EXCEEDED',
    });
  });

  it('blocks blacklisted IPs and known automation user agents on the click path too', async () => {
    prismaService.blacklistedIp.findUnique.mockResolvedValue({
      ipAddress: '127.0.0.1',
    });

    await expect(
      service.evaluateClickRequest('127.0.0.1', 'Mozilla/5.0'),
    ).resolves.toEqual({
      blocked: true,
      reason: 'IP_BLACKLISTED',
    });
  });

  it('permanently records honeypot hits with normalized IP address', async () => {
    prismaService.blacklistedIp.upsert.mockResolvedValue({
      ipAddress: '127.0.0.1',
      source: 'HONEYPOT',
    });

    await service.recordHoneypotHit('::ffff:127.0.0.1', 'BadBot/1.0');

    expect(prismaService.blacklistedIp.upsert).toHaveBeenCalledWith({
      where: { ipAddress: '127.0.0.1' },
      update: {
        source: 'HONEYPOT',
        reason: 'Hidden honeypot link requested by BadBot/1.0',
      },
      create: {
        ipAddress: '127.0.0.1',
        source: 'HONEYPOT',
        reason: 'Hidden honeypot link requested by BadBot/1.0',
      },
    });
  });
});
