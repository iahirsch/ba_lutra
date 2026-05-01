import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './activity.entity';
import { Companion } from '../companion/companion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, Companion])],
  exports: [TypeOrmModule],
})
export class ActivityModule {}
