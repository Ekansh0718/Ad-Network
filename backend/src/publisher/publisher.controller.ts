import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { CreateAdZoneDto } from './dto/create-ad-zone.dto';
import { ValidateDomainDto } from './dto/validate-domain.dto';
import { PublisherService } from './publisher.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';

@Controller('api/v1/publisher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PUBLISHER')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Post('domains/validate')
  validateDomain(@Req() req, @Body() dto: ValidateDomainDto) {
    return this.publisherService.validateDomain(req.user.id, dto);
  }

  @Post('ad-zones')
  createAdZone(@Req() req, @Body() dto: CreateAdZoneDto) {
    return this.publisherService.createAdZone(req.user.id, dto);
  }
}
