import { GeoIpService } from './geo-ip.service';

describe('GeoIpService', () => {
  it('uses the request country header for simulated local verification', () => {
    expect(new GeoIpService().resolveCountry('127.0.0.1', 'us')).toBe('US');
  });

  it('resolves from in-memory IP overrides without disk access', () => {
    process.env.GEOIP_COUNTRY_OVERRIDES = JSON.stringify({
      '203.0.113.10': 'US',
    });

    expect(new GeoIpService().resolveCountry('203.0.113.10')).toBe('US');

    delete process.env.GEOIP_COUNTRY_OVERRIDES;
  });

  it('resolves a real country from the MaxMind GeoLite2 .mmdb database once loaded', async () => {
    const service = new GeoIpService();
    await service.onModuleInit();

    // 81.2.69.142 is MaxMind's published GeoLite2 test fixture IP for GB.
    expect(service.resolveCountry('81.2.69.142')).toBe('GB');
  });

  it('falls back to null when the database has no record and no override/header applies', async () => {
    const service = new GeoIpService();
    await service.onModuleInit();

    expect(service.resolveCountry('198.51.100.1')).toBeNull();
  });

  it('logs a warning and falls back gracefully when GEOIP_DB_PATH points at a missing file', async () => {
    process.env.GEOIP_DB_PATH = 'test/fixtures/geoip/does-not-exist.mmdb';

    const service = new GeoIpService();
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(service.resolveCountry('81.2.69.142')).toBeNull();

    delete process.env.GEOIP_DB_PATH;
  });
});
