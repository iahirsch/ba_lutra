import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Companion } from './companion.entity';
import { Activity } from '../activity/activity.entity';
import { CompanionService } from './companion.service';
import { CompanionController } from './companion.controller';
import { CompanionGateway } from './companion.gateway';
import { ElevenLabsService } from './elevenlabs.service';
import { ElevenLabsController } from './elevenlabs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Companion, Activity])],
  controllers: [CompanionController, ElevenLabsController],
  providers: [CompanionService, CompanionGateway, ElevenLabsService],
  exports: [CompanionService, CompanionGateway],
})
export class CompanionModule {}
