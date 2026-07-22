import { Inject, Injectable, Logger } from '@nestjs/common';

import type {
  ClickEvent,
  ImpressionEvent,
  MessageBrokerPublisher,
} from './ad-event.types';

export const MESSAGE_BROKER_PUBLISHER = Symbol('MESSAGE_BROKER_PUBLISHER');
export const IMPRESSION_EVENTS_CHANNEL = 'adengine:events:impressions';
export const CLICK_EVENTS_CHANNEL = 'adengine:events:clicks';

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

  publishClick(event: ClickEvent) {
    void this.messageBrokerPublisher
      .publish(CLICK_EVENTS_CHANNEL, event)
      .catch((error) => {
        this.logger.error('Failed to publish click event', error);
      });
  }
}
