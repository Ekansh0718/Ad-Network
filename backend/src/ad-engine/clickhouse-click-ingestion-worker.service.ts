import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

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

@Injectable()
export class ClickHouseClickIngestionWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    ClickHouseClickIngestionWorkerService.name,
  );
  private running = false;
  private lastMessageId = '0-0';

  constructor(
    @Inject(MESSAGE_BROKER_CONSUMER)
    private readonly messageBrokerConsumer: MessageBrokerConsumer,
    @Inject(ANALYTICS_EVENT_STORE)
    private readonly analyticsEventStore: AnalyticsEventStore,
  ) {}

  onModuleInit() {
    if (process.env.CLICKHOUSE_INGESTION_ENABLED === 'false') {
      return;
    }

    this.running = true;
    void this.runLoop();
  }

  onModuleDestroy() {
    this.running = false;
  }

  async processNextBatch() {
    const messages = await this.messageBrokerConsumer.readBatch(
      CLICK_EVENTS_CHANNEL,
      this.lastMessageId,
      CLICKHOUSE_INGESTION_BATCH_SIZE,
      CLICKHOUSE_INGESTION_BLOCK_MS,
    );

    if (messages.length === 0) {
      return {
        inserted: 0,
      };
    }

    const events = messages.map((message) => message.payload as ClickEvent);
    await this.flush(events);
    await this.messageBrokerConsumer.acknowledge(
      CLICK_EVENTS_CHANNEL,
      messages.map((message) => message.id),
    );
    this.lastMessageId = messages[messages.length - 1].id;

    return {
      inserted: events.length,
    };
  }

  private async runLoop() {
    while (this.running) {
      try {
        await this.analyticsEventStore.ensureSchema();
        break;
      } catch (error) {
        this.logger.error(
          'ClickHouse schema initialization failed, retrying in 5s',
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    while (this.running) {
      try {
        await this.processNextBatch();
      } catch (error) {
        this.logger.error('ClickHouse click ingestion batch failed', error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async flush(events: ClickEvent[]) {
    for (
      let index = 0;
      index < events.length;
      index += CLICKHOUSE_INGESTION_BATCH_SIZE
    ) {
      await this.analyticsEventStore.insertClicks(
        events.slice(index, index + CLICKHOUSE_INGESTION_BATCH_SIZE),
      );
    }
  }
}
