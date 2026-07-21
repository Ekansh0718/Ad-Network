import { DeviceDetectorService } from './device-detector.service';

describe('DeviceDetectorService', () => {
  const service = new DeviceDetectorService();

  it('detects mobile user agents', () => {
    expect(service.detect('Mozilla/5.0 iPhone Mobile', 1366)).toBe('mobile');
  });

  it('falls back to viewport width when the user agent is generic', () => {
    expect(service.detect('Mozilla/5.0', 390)).toBe('mobile');
  });
});
