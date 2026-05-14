import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
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
}
