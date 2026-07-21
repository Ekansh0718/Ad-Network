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
});
