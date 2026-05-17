import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { StravaToken, STRAVA_TOKEN_ID } from './strava-token.entity';

const STRAVA_API = 'https://www.strava.com/api/v3';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const REFRESH_BUFFER_SECONDS = 300;

export interface StravaActivityDetail {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  average_speed: number;
  max_speed: number;
  elapsed_time: number;
  suffer_score: number | null;
  start_date: string;
}

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

  async getValidAccessToken(): Promise<string> {
    const row = await this.tokenRepo.findOneBy({ id: STRAVA_TOKEN_ID });
    if (!row) {
      throw new InternalServerErrorException('Strava not connected.');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Number(row.expiresAt) - now > REFRESH_BUFFER_SECONDS) {
      return row.accessToken;
    }

    return this.refreshAccessToken(row);
  }

  private async refreshAccessToken(row: StravaToken): Promise<string> {
    const clientId = this.config.getOrThrow<string>('STRAVA_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('STRAVA_CLIENT_SECRET');

    const { data } = await axios.post<{
      access_token: string;
      refresh_token: string;
      expires_at: number;
    }>(STRAVA_TOKEN_URL, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refreshToken,
      grant_type: 'refresh_token',
    });

    await this.tokenRepo.save({
      id: STRAVA_TOKEN_ID,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: String(data.expires_at),
      athleteId: row.athleteId,
      athleteName: row.athleteName,
    });

    return data.access_token;
  }

  async fetchActivityById(id: number): Promise<StravaActivityDetail> {
    const token = await this.getValidAccessToken();
    const { data } = await axios.get<StravaActivityDetail>(
      `${STRAVA_API}/activities/${id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  }
}
