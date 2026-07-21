import { Inject, Injectable } from '@nestjs/common';

import type {
  VelocityCounterResult,
  VelocityCounterStore,
} from './velocity-cap.types';

export const VELOCITY_COUNTER_STORE = Symbol('VELOCITY_COUNTER_STORE');

export type FrequencyCapDecision = {
  allowed: boolean;
  key: string;
  count: number;
  limit: number;
  ttlSeconds: number;
  reason?: string;
};

@Injectable()
export class FrequencyCappingService {
  private readonly impressionLimit = Number(
    process.env.VELOCITY_IMPRESSION_LIMIT ?? 2,
  );
  private readonly impressionWindowSeconds = Number(
    process.env.VELOCITY_IMPRESSION_WINDOW_SECONDS ?? 30,
  );

  constructor(
    @Inject(VELOCITY_COUNTER_STORE)
    private readonly velocityCounterStore: VelocityCounterStore,
  ) {}

  async evaluateImpression(
    ipAddress: string,
  ): Promise<FrequencyCapDecision> {
    const normalizedIp = this.normalizeIp(ipAddress);
    const key = `rate:imp:${normalizedIp}`;
    const counter = await this.velocityCounterStore.increment(
      key,
      this.impressionWindowSeconds,
    );

    return this.toDecision(counter, this.impressionLimit);
  }

  private toDecision(
    counter: VelocityCounterResult,
    limit: number,
  ): FrequencyCapDecision {
    const allowed = counter.count <= limit;

    return {
      allowed,
      key: counter.key,
      count: counter.count,
      limit,
      ttlSeconds: counter.ttlSeconds,
      reason: allowed ? undefined : 'IMPRESSION_VELOCITY_EXCEEDED',
    };
  }

  private normalizeIp(ipAddress: string) {
    return ipAddress.replace('::ffff:', '').split(',')[0].trim();
  }
}
