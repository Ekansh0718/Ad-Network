import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { AdvertiserService } from './advertiser.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';

@Controller('api/v1/advertiser')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADVERTISER')
export class AdvertiserController {
  constructor(private readonly advertiserService: AdvertiserService) {}

  @Post('campaigns')
  createCampaign(@Req() req, @Body() dto: CreateCampaignDto) {
    return this.advertiserService.createCampaign(req.user.id, dto);
  }
}
