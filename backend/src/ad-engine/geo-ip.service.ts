import { Injectable } from '@nestjs/common';

@Injectable()
export class GeoIpService {
  private readonly countryOverrides = this.loadCountryOverrides();

  resolveCountry(ipAddress: string, countryHeader?: string): string | null {
    if (countryHeader) {
      return countryHeader.trim().toUpperCase();
    }

    const normalizedIp = this.normalizeIp(ipAddress);

    return this.countryOverrides.get(normalizedIp) ?? null;
  }

  private normalizeIp(ipAddress: string) {
    return ipAddress.replace('::ffff:', '').split(',')[0].trim();
  }

  private loadCountryOverrides() {
    const overrides = new Map<string, string>();

    if (!process.env.GEOIP_COUNTRY_OVERRIDES) {
      return overrides;
    }

    try {
      const parsed = JSON.parse(process.env.GEOIP_COUNTRY_OVERRIDES) as Record<
        string,
        string
      >;

      for (const [ipAddress, country] of Object.entries(parsed)) {
        overrides.set(this.normalizeIp(ipAddress), country.toUpperCase());
      }
    } catch {
      return overrides;
    }

    return overrides;
  }
}
