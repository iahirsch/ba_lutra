import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Companion } from './companion.entity';
import { CompanionService } from './companion.service';
import { CompanionController } from './companion.controller';
import { CompanionGateway } from './companion.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Companion])],
  controllers: [CompanionController],
  providers: [CompanionService, CompanionGateway],
  exports: [CompanionService, CompanionGateway],
})
export class CompanionModule {}
