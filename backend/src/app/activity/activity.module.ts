import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './activity.entity';
import { StravaToken } from './strava-token.entity';
import { StravaService } from './strava.service';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { StravaController } from './strava.controller';
import { CompanionModule } from '../companion/companion.module';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, StravaToken]), CompanionModule],
  providers: [StravaService, ActivityService],
  controllers: [ActivityController, StravaController],
  exports: [ActivityService],
})
export class ActivityModule {}
