import { readFileSync } from 'fs';
import { join } from 'path';

describe('advertiser studio static UI', () => {
  const publicDir = join(process.cwd(), '..', 'frontend');
  const html = readFileSync(
    join(publicDir, 'advertiser-studio.html'),
    'utf8',
  );
  const script = readFileSync(
    join(publicDir, 'advertiser-studio.js'),
    'utf8',
  );

  it('contains campaign wizard surfaces for budget, targeting, and creative setup', () => {
    expect(html).toContain('id="campaignForm"');
    expect(html).toContain('name="targetCountries"');
    expect(html).toContain('name="targetDevices"');
    expect(html).toContain('name="creativeType"');
  });

  it('submits campaigns to the advertiser creation endpoint', () => {
    expect(script).toContain('/api/v1/auth/login');
    expect(script).toContain('/api/v1/advertiser/campaigns');
    expect(script).toContain('Daily budget cannot exceed total budget');
  });
});
