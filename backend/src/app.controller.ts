import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getPlatform() {
    return {
      name: 'Ad Network',
      status: 'online',
      dashboard: '/assets/analytics-dashboard.html',
      publisherPortal: '/assets/publisher-portal.html',
      advertiserStudio: '/assets/advertiser-studio.html',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
