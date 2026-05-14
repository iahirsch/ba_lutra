import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { StravaService } from './strava.service';

@ApiTags('strava')
@Controller('strava')
export class StravaController {
  private readonly logger = new Logger(StravaController.name);

  constructor(
    private readonly stravaService: StravaService,
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
}
