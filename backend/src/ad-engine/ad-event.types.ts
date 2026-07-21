export type ImpressionEvent = {
  type: 'impression';
  zone: string;
  campaign: string;
  advertiser: string;
  cost: number;
  time: number;
  request: {
    origin: string;
    path: string;
    country: string | null;
    device: string;
    ipAddress: string;
    userAgent: string;
  };
};

export interface MessageBrokerPublisher {
  publish(channel: string, payload: ImpressionEvent): Promise<void>;
}

export type BrokerMessage<TPayload> = {
  id: string;
  payload: TPayload;
};

export interface MessageBrokerConsumer {
  readBatch(
    channel: string,
    lastMessageId: string,
    count: number,
    blockMs: number,
  ): Promise<BrokerMessage<ImpressionEvent>[]>;
  acknowledge(channel: string, messageIds: string[]): Promise<void>;
}

export interface AnalyticsEventStore {
  ensureSchema(): Promise<void>;
  insertImpressions(events: ImpressionEvent[]): Promise<void>;
}
