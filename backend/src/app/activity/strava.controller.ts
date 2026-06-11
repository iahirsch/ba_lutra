import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ActivityService } from './activity.service';
import { StravaService } from './strava.service';
import { CompanionGateway } from '../companion/companion.gateway';

interface StravaWebhookEvent {
  object_type: string;
  object_id: number;
  aspect_type: string;
}

@ApiTags('strava')
@Controller('strava')
export class StravaController {
  private readonly logger = new Logger(StravaController.name);

  constructor(
    private readonly stravaService: StravaService,
    private readonly activityService: ActivityService,
    private readonly companionGateway: CompanionGateway,
    private readonly config: ConfigService,
  ) {}

  @Get('auth')
  @Redirect()
  @ApiOperation({ summary: 'Redirect to Strava OAuth' })
  initiateAuth() {
    return { url: this.stravaService.buildAuthUrl(), statusCode: 302 };
  }

  @Get('callback')
  @Redirect()
  @ApiOperation({ summary: 'OAuth callback. Exchange code for tokens' })
  async handleCallback(
    @Query('code') code?: string,
    @Query('error') error?: string,
    @Query('scope') scope?: string,
  ) {
    const base = this.config.get<string>('FRONTEND_URL', '');
    const adminUrl = (r: string) => `${base}/admin?strava=${r}`;

    if (error || !code) {
      this.logger.warn(`OAuth denied or missing code: ${error}`);
      return { url: adminUrl('denied'), statusCode: 302 };
    }

    if (!scope?.includes('activity:read_all')) {
      this.logger.warn(`Insufficient scope: ${scope}`);
      return { url: adminUrl('scope_missing'), statusCode: 302 };
    }

    try {
      await this.stravaService.exchangeCode(code);
      return { url: adminUrl('connected'), statusCode: 302 };
    } catch (err) {
      this.logger.error('Token exchange failed', err);
      return { url: adminUrl('error'), statusCode: 302 };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Connection status' })
  getStatus() {
    return this.stravaService.getStatus();
  }

  @Delete('connection')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke Strava and delete stored tokens' })
  async disconnect() {
    await this.stravaService.disconnect();
    return { disconnected: true };
  }

  @Get('webhook')
  @ApiOperation({ summary: 'Strava webhook subscription validation' })
  validateWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
  ) {
    const expected = this.config.get<string>('STRAVA_WEBHOOK_VERIFY_TOKEN');
    if (!expected) {
      this.logger.error('STRAVA_WEBHOOK_VERIFY_TOKEN is not set in .env');
      throw new InternalServerErrorException(
        'STRAVA_WEBHOOK_VERIFY_TOKEN not configured',
      );
    }

    if (verifyToken !== expected) {
      this.logger.warn('Webhook validation: hub.verify_token mismatch');
      throw new ForbiddenException('Invalid hub.verify_token');
    }

    if (!challenge) {
      throw new ForbiddenException('Missing hub.challenge');
    }

    if (mode !== 'subscribe') {
      this.logger.warn(`Webhook validation: unexpected hub.mode=${mode}`);
    }

    this.logger.log('Strava webhook validation OK');
    return { 'hub.challenge': challenge };
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Strava webhook events' })
  handleWebhook(@Body() event: StravaWebhookEvent) {
    if (event.object_type === 'activity' && event.aspect_type === 'create') {
      const companionId = this.companionGateway.getActiveCompanionId();
      void this.activityService
        .saveStravaActivity(event.object_id, companionId)
        .then(() => {
          if (companionId) {
            return this.companionGateway.refreshActivityForCompanion(companionId);
          }
        })
        .catch((err: unknown) =>
          this.logger.error(`Webhook activity ${event.object_id}`, err),
        );
    }
    return { received: true };
  }
}
