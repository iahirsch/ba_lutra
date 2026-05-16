import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { StravaToken, STRAVA_TOKEN_ID } from './strava-token.entity';

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export interface StravaStatus {
  connected: boolean;
  athleteName: string | null;
  athleteId: string | null;
}

interface TokenExchangeResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
}

@Injectable()
export class StravaService implements OnModuleInit {
  private readonly logger = new Logger(StravaService.name);

  constructor(
    @InjectRepository(StravaToken)
    private readonly tokenRepo: Repository<StravaToken>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const existing = await this.tokenRepo.findOneBy({
      id: STRAVA_TOKEN_ID,
    });
    if (existing) return;

    const accessToken = this.config.get<string>('STRAVA_ACCESS_TOKEN');
    const refreshToken = this.config.get<string>('STRAVA_REFRESH_TOKEN');

    if (!accessToken || !refreshToken) {
      this.logger.warn(
        'No Strava tokens in DB. Connect via Admin or set env vars.',
      );
      return;
    }

    await this.tokenRepo.save({
      id: STRAVA_TOKEN_ID,
      accessToken,
      refreshToken,
      expiresAt: '0',
      athleteId: null,
      athleteName: null,
    });

    this.logger.log('Strava tokens seeded from environment.');
  }

  buildAuthUrl(): string {
    const clientId = this.config.getOrThrow<string>('STRAVA_CLIENT_ID');
    const redirectUri = this.config.getOrThrow<string>('STRAVA_REDIRECT_URI');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'force',
      scope: 'activity:read_all',
    });
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<void> {
    const clientId = this.config.getOrThrow<string>('STRAVA_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('STRAVA_CLIENT_SECRET');

    const { data } = await axios.post<TokenExchangeResponse>(STRAVA_TOKEN_URL, {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    });

    const athleteName = data.athlete
      ? [data.athlete.firstname, data.athlete.lastname]
          .filter(Boolean)
          .join(' ')
      : null;

    await this.tokenRepo.save({
      id: STRAVA_TOKEN_ID,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: String(data.expires_at),
      athleteId: data.athlete ? String(data.athlete.id) : null,
      athleteName,
    });

    this.logger.log(`Strava OAuth OK. ${athleteName ?? 'unknown'}`);
  }

  async getStatus(): Promise<StravaStatus> {
    const row = await this.tokenRepo.findOneBy({
      id: STRAVA_TOKEN_ID,
    });
    if (!row) return { connected: false, athleteName: null, athleteId: null };

    return {
      connected: true,
      athleteName: row.athleteName,
      athleteId: row.athleteId,
    };
  }

  async disconnect(): Promise<void> {
    const row = await this.tokenRepo.findOneBy({
      id: STRAVA_TOKEN_ID,
    });
    if (!row) return;

    try {
      await axios.post('https://www.strava.com/oauth/deauthorize', {
        access_token: row.accessToken,
      });
      this.logger.log('Strava deauthorize OK.');
    } catch {
      this.logger.warn(
        'Strava deauthorize failed. Clearing local tokens anyway.',
      );
    }

    await this.tokenRepo.delete({ id: STRAVA_TOKEN_ID });
    this.logger.log('Strava tokens removed.');
  }
}
