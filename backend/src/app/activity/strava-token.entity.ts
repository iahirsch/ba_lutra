import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * The ID of the installation of the Strava token. Limited to 1 from
 * the Strava API.
 */
export const STRAVA_TOKEN_ID = 1;

@Entity({ name: 'strava_tokens' })
export class StravaToken {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'text' })
  accessToken!: string;

  @Column({ type: 'text' })
  refreshToken!: string;

  @Column({ type: 'bigint' })
  expiresAt!: string;

  @Column({ type: 'bigint', nullable: true })
  athleteId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  athleteName!: string | null;
}
