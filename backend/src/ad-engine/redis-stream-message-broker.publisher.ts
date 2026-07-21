import { Injectable, OnModuleDestroy } from '@nestjs/common';

import type { ImpressionEvent, MessageBrokerPublisher } from './ad-event.types';
import { RedisRespClient } from './redis-resp.client';

@Injectable()
export class RedisStreamMessageBrokerPublisher
  implements MessageBrokerPublisher, OnModuleDestroy
{
  private readonly redis = new RedisRespClient({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
  });

  async publish(channel: string, payload: ImpressionEvent) {
    await this.redis.command([
      'XADD',
      channel,
      '*',
      'payload',
      JSON.stringify(payload),
    ]);
  }

  onModuleDestroy() {
    this.redis.destroy();
  }
}
