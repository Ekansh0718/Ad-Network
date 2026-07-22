type RequestContext = {
  origin: string;
  path: string;
  country: string | null;
  device: string;
  ipAddress: string;
  userAgent: string;
};

export type ImpressionEvent = {
  type: 'impression';
  zone: string;
  campaign: string;
  advertiser: string;
  cost: number;
  time: number;
  request: RequestContext;
};

export type ClickEvent = {
  type: 'click';
  zone: string;
  campaign: string;
  advertiser: string;
  cost: number;
  time: number;
  request: RequestContext;
};

export type AdEvent = ImpressionEvent | ClickEvent;

export interface MessageBrokerPublisher {
  publish(channel: string, payload: AdEvent): Promise<void>;
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
  ): Promise<BrokerMessage<AdEvent>[]>;
  acknowledge(channel: string, messageIds: string[]): Promise<void>;
}

export interface AnalyticsEventStore {
  ensureSchema(): Promise<void>;
  insertImpressions(events: ImpressionEvent[]): Promise<void>;
  insertClicks(events: ClickEvent[]): Promise<void>;
}
