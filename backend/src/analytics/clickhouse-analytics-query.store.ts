import { Injectable } from '@nestjs/common';

import type { AnalyticsQueryStore, MetricsRow } from './analytics-query.types';

@Injectable()
export class ClickHouseAnalyticsQueryStore implements AnalyticsQueryStore {
  private readonly options = {
    url: process.env.CLICKHOUSE_URL ?? 'http://127.0.0.1:8123',
    database: process.env.CLICKHOUSE_DB ?? 'analytics',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD,
  };

  async getDailyMetrics(params: {
    startDate: string;
    endDate: string;
  }): Promise<MetricsRow[]> {
    const sql = `
      SELECT
        date,
        impressions,
        clicks,
        round(if(impressions > 0, (clicks / impressions) * 100, 0), 4) AS ctr,
        spend,
        round(spend * 0.7, 4) AS payout
      FROM
      (
        SELECT
          ifNull(daily_impressions.date, daily_clicks.date) AS date,
          ifNull(daily_impressions.impressions, 0) AS impressions,
          ifNull(daily_clicks.clicks, 0) AS clicks,
          ifNull(daily_impressions.spend, 0) AS spend
        FROM
        (
          SELECT
            toDate(event_time) AS date,
            count() AS impressions,
            round(sum(cost), 4) AS spend
          FROM ${this.options.database}.impressions
          WHERE event_time >= parseDateTimeBestEffort('${params.startDate}')
            AND event_time < parseDateTimeBestEffort('${params.endDate}') + INTERVAL 1 DAY
          GROUP BY date
        ) AS daily_impressions
        FULL OUTER JOIN
        (
          SELECT
            toDate(event_time) AS date,
            count() AS clicks
          FROM ${this.options.database}.clicks
          WHERE event_time >= parseDateTimeBestEffort('${params.startDate}')
            AND event_time < parseDateTimeBestEffort('${params.endDate}') + INTERVAL 1 DAY
          GROUP BY date
        ) AS daily_clicks
        ON daily_impressions.date = daily_clicks.date
      )
      ORDER BY date ASC
      FORMAT JSONEachRow
    `;
    const response = await this.query(sql);

    return response
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const row = JSON.parse(line) as MetricsRow;

        return {
          date: row.date,
          impressions: Number(row.impressions),
          clicks: Number(row.clicks),
          ctr: Number(row.ctr),
          spend: Number(row.spend),
          payout: Number(row.payout),
        };
      });
  }

  private async query(sql: string) {
    const url = new URL('/', this.options.url);
    url.searchParams.set('query', sql);

    const headers: Record<string, string> = {};

    if (this.options.username) {
      headers.Authorization = `Basic ${Buffer.from(
        `${this.options.username}:${this.options.password ?? ''}`,
      ).toString('base64')}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`ClickHouse analytics query failed: ${response.status}`);
    }

    return response.text();
  }
}
