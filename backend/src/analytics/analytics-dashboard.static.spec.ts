import { readFileSync } from 'fs';
import { join } from 'path';

describe('analytics dashboard static UI', () => {
  const publicDir = join(process.cwd(), '..', 'frontend');
  const html = readFileSync(
    join(publicDir, 'analytics-dashboard.html'),
    'utf8',
  );
  const script = readFileSync(
    join(publicDir, 'analytics-dashboard.js'),
    'utf8',
  );

  it('contains date filters, summary KPIs, table, and canvas chart', () => {
    expect(html).toContain('id="startDate"');
    expect(html).toContain('id="totalCtr"');
    expect(html).toContain('id="metricsRows"');
    expect(html).toContain('id="metricsChart"');
  });

  it('loads secured analytics data and renders CTR/payout values', () => {
    expect(script).toContain('/api/v1/auth/login');
    expect(script).toContain('/api/v1/analytics/daily');
    expect(script).toContain('renderChart');
    expect(script).toContain('totalPayout');
  });
});
