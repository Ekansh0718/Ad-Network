import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { IMPRESSION_EVENTS_CHANNEL } from './ad-event-producer.service';
import type {
  AnalyticsEventStore,
  ImpressionEvent,
  MessageBrokerConsumer,
} from './ad-event.types';
import {
  ANALYTICS_EVENT_STORE,
  CLICKHOUSE_INGESTION_BATCH_SIZE,
  CLICKHOUSE_INGESTION_BLOCK_MS,
  ClickHouseIngestionWorkerService,
  MESSAGE_BROKER_CONSUMER,
} from './clickhouse-ingestion-worker.service';

const createEvent = (index: number): ImpressionEvent => ({
  type: 'impression',
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

describe('ClickHouseIngestionWorkerService', () => {
  let service: ClickHouseIngestionWorkerService;
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
        ClickHouseIngestionWorkerService,
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

    service = module.get(ClickHouseIngestionWorkerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads up to 2,000 messages, bulk inserts them, then acknowledges processed IDs', async () => {
    const messages = Array.from({ length: 2000 }, (_, index) => ({
      id: `1719274200-${index}`,
      payload: createEvent(index),
    }));
    consumer.readBatch.mockResolvedValue(messages);

    await expect(service.processNextBatch()).resolves.toEqual({
      inserted: 2000,
    });

    expect(consumer.readBatch).toHaveBeenCalledWith(
      IMPRESSION_EVENTS_CHANNEL,
      '0-0',
      CLICKHOUSE_INGESTION_BATCH_SIZE,
      CLICKHOUSE_INGESTION_BLOCK_MS,
    );
    expect(analyticsStore.insertImpressions).toHaveBeenCalledTimes(1);
    expect(analyticsStore.insertImpressions).toHaveBeenCalledWith(
      messages.map((message) => message.payload),
    );
    expect(consumer.acknowledge).toHaveBeenCalledWith(
      IMPRESSION_EVENTS_CHANNEL,
      messages.map((message) => message.id),
    );
  });

  it('does not acknowledge messages if ClickHouse insertion fails', async () => {
    consumer.readBatch.mockResolvedValue([
      {
        id: '1719274200-0',
        payload: createEvent(0),
      },
    ]);
    analyticsStore.insertImpressions.mockRejectedValue(
      new Error('ClickHouse unavailable'),
    );

    await expect(service.processNextBatch()).rejects.toThrow(
      'ClickHouse unavailable',
    );
    expect(consumer.acknowledge).not.toHaveBeenCalled();
  });

  it('initializes the ClickHouse schema only when ingestion is enabled', async () => {
    process.env.CLICKHOUSE_INGESTION_ENABLED = 'true';
    consumer.readBatch.mockResolvedValue([]);

    await service.onModuleInit();
    service.onModuleDestroy();

    expect(analyticsStore.ensureSchema).toHaveBeenCalledTimes(1);

    delete process.env.CLICKHOUSE_INGESTION_ENABLED;
  });

  it('skips schema initialization when ingestion is explicitly disabled', async () => {
    process.env.CLICKHOUSE_INGESTION_ENABLED = 'false';

    await service.onModuleInit();

    expect(analyticsStore.ensureSchema).not.toHaveBeenCalled();

    delete process.env.CLICKHOUSE_INGESTION_ENABLED;
  });
});
