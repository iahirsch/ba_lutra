import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { Activity } from './app/activity/activity.entity';
import { Companion } from './app/companion/companion.entity';

config({ path: join(__dirname, '..', '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true',
  entities: [Activity, Companion],
  migrations: ['backend/src/migrations/*.ts'],
});
