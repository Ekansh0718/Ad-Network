import { Inject, Injectable, Logger } from '@nestjs/common';

import type { ImpressionEvent, MessageBrokerPublisher } from './ad-event.types';

export const MESSAGE_BROKER_PUBLISHER = Symbol('MESSAGE_BROKER_PUBLISHER');
export const IMPRESSION_EVENTS_CHANNEL = 'adengine:events:impressions';

@Injectable()
export class AdEventProducerService {
  private readonly logger = new Logger(AdEventProducerService.name);

  constructor(
    @Inject(MESSAGE_BROKER_PUBLISHER)
    private readonly messageBrokerPublisher: MessageBrokerPublisher,
  ) {}

  publishImpression(event: ImpressionEvent) {
    void this.messageBrokerPublisher
      .publish(IMPRESSION_EVENTS_CHANNEL, event)
      .catch((error) => {
        this.logger.error('Failed to publish impression event', error);
      });
  }
}
