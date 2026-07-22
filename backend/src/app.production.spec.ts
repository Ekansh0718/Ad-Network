import { readFileSync } from 'fs';
import { join } from 'path';

describe('production readiness surface', () => {
  const frontendDir = join(process.cwd(), '..', 'frontend');

  it('serves a product console entry point from the frontend directory', () => {
    const html = readFileSync(join(frontendDir, 'index.html'), 'utf8');

    expect(html).toContain('Ad Network Console');
    expect(html).toContain('/assets/publisher-portal.html');
    expect(html).toContain('/assets/advertiser-studio.html');
    expect(html).toContain('/assets/analytics-dashboard.html');
  });

  it('documents required production environment variables', () => {
    const envExample = readFileSync(
      join(process.cwd(), '.env.example'),
      'utf8',
    );

    expect(envExample).toContain('DATABASE_URL=');
    expect(envExample).toContain('JWT_SECRET=');
    expect(envExample).toContain('CLICKHOUSE_URL=');
    expect(envExample).toContain('CAMPAIGN_CACHE_SYNC_ENABLED=');
  });
});
