import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CLICK_EVENTS_CHANNEL } from './ad-event-producer.service';
import type {
  AnalyticsEventStore,
  ClickEvent,
  MessageBrokerConsumer,
} from './ad-event.types';
import {
  ANALYTICS_EVENT_STORE,
  CLICKHOUSE_INGESTION_BATCH_SIZE,
  CLICKHOUSE_INGESTION_BLOCK_MS,
  MESSAGE_BROKER_CONSUMER,
} from './clickhouse-ingestion-worker.service';
import { ClickHouseClickIngestionWorkerService } from './clickhouse-click-ingestion-worker.service';

const createEvent = (index: number): ClickEvent => ({
  type: 'click',
  zone: '42',
  campaign: `campaign-${index}`,
  advertiser: 'advertiser-1',
  cost: 0.001,
  time: 1719274200 + index,
  request: {
    origin: 'https://publisher.test',
    path: '/article',
    country: 'US',
    device: 'mobile',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Mobile',
  },
});

describe('ClickHouseClickIngestionWorkerService', () => {
  let service: ClickHouseClickIngestionWorkerService;
  let consumer: jest.Mocked<MessageBrokerConsumer>;
  let analyticsStore: jest.Mocked<AnalyticsEventStore>;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    consumer = {
      readBatch: jest.fn(),
      acknowledge: jest.fn(),
    };
    analyticsStore = {
      ensureSchema: jest.fn(),
      insertImpressions: jest.fn(),
      insertClicks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClickHouseClickIngestionWorkerService,
        {
          provide: MESSAGE_BROKER_CONSUMER,
          useValue: consumer,
        },
        {
          provide: ANALYTICS_EVENT_STORE,
          useValue: analyticsStore,
        },
      ],
    }).compile();

    service = module.get(ClickHouseClickIngestionWorkerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads up to 2,000 click messages, bulk inserts them, then acknowledges processed IDs', async () => {
    const messages = Array.from({ length: 2000 }, (_, index) => ({
      id: `1719274200-${index}`,
      payload: createEvent(index),
    }));
    consumer.readBatch.mockResolvedValue(messages);

    await expect(service.processNextBatch()).resolves.toEqual({
      inserted: 2000,
    });

    expect(consumer.readBatch).toHaveBeenCalledWith(
      CLICK_EVENTS_CHANNEL,
      '0-0',
      CLICKHOUSE_INGESTION_BATCH_SIZE,
      CLICKHOUSE_INGESTION_BLOCK_MS,
    );
    expect(analyticsStore.insertClicks).toHaveBeenCalledTimes(1);
    expect(analyticsStore.insertClicks).toHaveBeenCalledWith(
      messages.map((message) => message.payload),
    );
    expect(consumer.acknowledge).toHaveBeenCalledWith(
      CLICK_EVENTS_CHANNEL,
      messages.map((message) => message.id),
    );
  });

  it('does not acknowledge messages if ClickHouse click insertion fails', async () => {
    consumer.readBatch.mockResolvedValue([
      {
        id: '1719274200-0',
        payload: createEvent(0),
      },
    ]);
    analyticsStore.insertClicks.mockRejectedValue(
      new Error('ClickHouse unavailable'),
    );

    await expect(service.processNextBatch()).rejects.toThrow(
      'ClickHouse unavailable',
    );
    expect(consumer.acknowledge).not.toHaveBeenCalled();
  });

  it('initializes the ClickHouse schema only when ingestion is enabled', async () => {
    consumer.readBatch.mockResolvedValue([]);

    await service.onModuleInit();
    service.onModuleDestroy();

    expect(analyticsStore.ensureSchema).toHaveBeenCalledTimes(1);
  });

  it('skips schema initialization when ingestion is explicitly disabled', async () => {
    process.env.CLICKHOUSE_INGESTION_ENABLED = 'false';

    await service.onModuleInit();

    expect(analyticsStore.ensureSchema).not.toHaveBeenCalled();

    delete process.env.CLICKHOUSE_INGESTION_ENABLED;
  });
});
