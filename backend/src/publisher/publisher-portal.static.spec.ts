import { readFileSync } from 'fs';
import { join } from 'path';

describe('publisher portal static UI', () => {
  const publicDir = join(process.cwd(), 'public');
  const html = readFileSync(
    join(publicDir, 'publisher-portal.html'),
    'utf8',
  );
  const script = readFileSync(
    join(publicDir, 'publisher-portal.js'),
    'utf8',
  );

  it('contains the login, domain validation, placement, and generated tag surfaces', () => {
    expect(html).toContain('id="loginForm"');
    expect(html).toContain('id="domainForm"');
    expect(html).toContain('id="zoneForm"');
    expect(html).toContain('id="snippet"');
  });

  it('calls the publisher APIs required by the workbook workflow', () => {
    expect(script).toContain('/api/v1/auth/login');
    expect(script).toContain('/api/v1/publisher/domains/validate');
    expect(script).toContain('/api/v1/publisher/ad-zones');
  });
});
