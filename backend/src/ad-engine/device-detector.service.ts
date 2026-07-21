import { Injectable } from '@nestjs/common';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

@Injectable()
export class DeviceDetectorService {
  detect(userAgent = '', viewportWidth?: number): DeviceType {
    const normalizedUserAgent = userAgent.toLowerCase();

    if (/ipad|tablet/.test(normalizedUserAgent)) {
      return 'tablet';
    }

    if (/mobile|android|iphone|ipod/.test(normalizedUserAgent)) {
      return 'mobile';
    }

    if (viewportWidth && viewportWidth > 0 && viewportWidth < 768) {
      return 'mobile';
    }

    return 'desktop';
  }
}
