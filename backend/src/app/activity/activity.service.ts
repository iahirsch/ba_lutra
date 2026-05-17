import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Companion } from '../companion/companion.entity';
import { Activity } from './activity.entity';
import { StravaService } from './strava.service';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    private readonly stravaService: StravaService,
  ) {}

  async findAll(): Promise<Activity[]> {
    return this.activityRepo.find({ order: { startedAt: 'DESC' } });
  }

  async findByCompanion(companionId: string): Promise<Activity[]> {
    return this.activityRepo.find({
      where: { companion: { id: companionId } },
      order: { startedAt: 'DESC' },
    });
  }

  async saveStravaActivity(
    stravaActivityId: number,
    companionId: string | null,
  ): Promise<Activity | null> {
    const stravaId = String(stravaActivityId);

    if (await this.activityRepo.existsBy({ stravaActivityId: stravaId })) {
      return null;
    }

    const raw = await this.stravaService.fetchActivityById(stravaActivityId);

    const activity = this.activityRepo.create({
      stravaActivityId: stravaId,
      companion: companionId
        ? ({ id: companionId } satisfies Pick<Companion, 'id'>)
        : null,
      name: raw.name ?? null,
      type: raw.sport_type || raw.type,
      durationSeconds: raw.elapsed_time,
      distanceMeters: raw.distance,
      intensityScore: raw.suffer_score ?? 0,
      startedAt: new Date(raw.start_date),
    });

    const saved = await this.activityRepo.save(activity);
    this.logger.log(
      `Saved activity ${stravaId}${companionId ? ` → companion ${companionId}` : ''}`,
    );
    return saved;
  }
}
