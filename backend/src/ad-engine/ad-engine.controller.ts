import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Ip,
  Query,
} from '@nestjs/common';

import { AdEventProducerService } from './ad-event-producer.service';
import { AdTargetingService } from './ad-targeting.service';
import { DeviceDetectorService } from './device-detector.service';
import { FraudDetectionService } from './fraud-detection.service';
import { GeoIpService } from './geo-ip.service';

@Controller('api/v1')
export class AdEngineController {
  constructor(
    private readonly adTargetingService: AdTargetingService,
    private readonly adEventProducerService: AdEventProducerService,
    private readonly deviceDetectorService: DeviceDetectorService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly geoIpService: GeoIpService,
  ) {}

  @Get('serve')
  async serve(
    @Query('zoneId') zoneId: string,
    @Query('origin') origin: string,
    @Query('path') path: string,
    @Query('viewportWidth') viewportWidth: string,
    @Query('viewportHeight') viewportHeight: string,
    @Query('devicePixelRatio') devicePixelRatio: string,
    @Query('referrer') referrer: string,
    @Headers('user-agent') userAgent: string,
    @Headers('x-geo-country') countryHeader: string,
    @Ip() ipAddress: string,
  ) {
    const fraudDecision =
      await this.fraudDetectionService.evaluateServeRequest(
        ipAddress,
        userAgent,
      );

    if (fraudDecision.blocked) {
      throw new ForbiddenException(fraudDecision.reason);
    }

    const numericViewportWidth = Number(viewportWidth);
    const numericViewportHeight = Number(viewportHeight);
    const country = this.geoIpService.resolveCountry(ipAddress, countryHeader);
    const device = this.deviceDetectorService.detect(
      userAgent,
      numericViewportWidth,
    );
    const selectedCampaign = await this.adTargetingService.selectCampaign({
      zoneId,
      country,
      device,
    });

    if (selectedCampaign) {
      this.adEventProducerService.publishImpression({
        type: 'impression',
        zone: zoneId,
        campaign: selectedCampaign.id,
        advertiser: selectedCampaign.advertiserId,
        cost: selectedCampaign.maxCpc,
        time: Math.floor(Date.now() / 1000),
        request: {
          origin,
          path,
          country,
          device,
          ipAddress,
          userAgent,
        },
      });
    }

    return {
      type: 'ad_response',
      zoneId,
      request: {
        origin,
        path,
        viewportWidth: numericViewportWidth,
        viewportHeight: numericViewportHeight,
        devicePixelRatio: Number(devicePixelRatio),
        referrer,
        userAgent,
        ipAddress,
        country,
        device,
      },
      creative: selectedCampaign
        ? {
            campaignId: selectedCampaign.id,
            advertiserId: selectedCampaign.advertiserId,
            campaignName: selectedCampaign.campaignName,
            bidUsd: selectedCampaign.maxCpc,
            html: `<a href="/api/v1/trap" style="display:none !important;"></a>`,
          }
        : null,
    };
  }

  @Get('trap')
  async trap(
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
  ) {
    await this.fraudDetectionService.recordHoneypotHit(
      ipAddress,
      userAgent,
    );

    return {
      blocked: true,
    };
  }
}
