import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { PublisherService } from './publisher.service';

describe('PublisherService', () => {
  let service: PublisherService;
  const prismaService = {
    publisherSite: {
      upsert: jest.fn(),
    },
    adZone: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('adnetwork-verify=publisher-1'),
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublisherService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get(PublisherService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates publisher ads.txt and persists the verified domain entry', async () => {
    prismaService.publisherSite.upsert.mockResolvedValue({
      id: 'site-1',
      domain: 'publisher-site.com',
      verified: true,
    });

    await expect(
      service.validateDomain('publisher-1', {
        domain: 'https://publisher-site.com/page',
      }),
    ).resolves.toEqual({
      id: 'site-1',
      domain: 'publisher-site.com',
      verified: true,
    });
    expect(fetch).toHaveBeenCalledWith('https://publisher-site.com/ads.txt');
    expect(prismaService.publisherSite.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          publisherId_domain: {
            publisherId: 'publisher-1',
            domain: 'publisher-site.com',
          },
        },
        create: expect.objectContaining({
          expectedText: 'adnetwork-verify=publisher-1',
          verified: true,
        }),
      }),
    );
  });

  it('rejects domains missing the required ads.txt verification text', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('other-network=123'),
    } as any);

    await expect(
      service.validateDomain('publisher-1', {
        domain: 'publisher-site.com',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaService.publisherSite.upsert).not.toHaveBeenCalled();
  });

  it('creates an ad zone and returns a copy-ready async script snippet', async () => {
    prismaService.adZone.create.mockResolvedValue({
      id: 'zone-42',
      publisherId: 'publisher-1',
      zoneName: 'Homepage rectangle',
      width: 300,
      height: 250,
      layoutType: 'rectangle',
    });

    await expect(
      service.createAdZone('publisher-1', {
        zoneName: 'Homepage rectangle',
        width: 300,
        height: 250,
        layoutType: 'rectangle',
      }),
    ).resolves.toEqual({
      zone: expect.objectContaining({
        id: 'zone-42',
      }),
      snippet:
        '<section data-zone-id="zone-42"></section>\n<script async src="http://localhost:3000/assets/publisher_tag.js"></script>',
    });
  });
});
