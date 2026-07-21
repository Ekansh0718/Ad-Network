import { Test, TestingModule } from '@nestjs/testing';

import { PublisherController } from './publisher.controller';
import { PublisherService } from './publisher.service';

describe('PublisherController', () => {
  let controller: PublisherController;
  const publisherService = {
    validateDomain: jest.fn(),
    createAdZone: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublisherController],
      providers: [
        {
          provide: PublisherService,
          useValue: publisherService,
        },
      ],
    }).compile();

    controller = module.get(PublisherController);
  });

  it('passes the authenticated publisher id into domain validation', async () => {
    publisherService.validateDomain.mockResolvedValue({
      id: 'site-1',
    });

    await controller.validateDomain(
      { user: { id: 'publisher-1' } },
      { domain: 'publisher-site.com' },
    );

    expect(publisherService.validateDomain).toHaveBeenCalledWith(
      'publisher-1',
      { domain: 'publisher-site.com' },
    );
  });

  it('passes the authenticated publisher id into ad-zone creation', async () => {
    publisherService.createAdZone.mockResolvedValue({
      zone: { id: 'zone-42' },
      snippet: 'snippet',
    });

    await controller.createAdZone(
      { user: { id: 'publisher-1' } },
      {
        zoneName: 'Homepage',
        width: 300,
        height: 250,
        layoutType: 'rectangle',
      },
    );

    expect(publisherService.createAdZone).toHaveBeenCalledWith(
      'publisher-1',
      {
        zoneName: 'Homepage',
        width: 300,
        height: 250,
        layoutType: 'rectangle',
      },
    );
  });
});
