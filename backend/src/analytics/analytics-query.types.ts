export type MetricsRow = {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  payout: number;
};

export interface AnalyticsQueryStore {
  getDailyMetrics(params: {
    startDate: string;
    endDate: string;
  }): Promise<MetricsRow[]>;
}
