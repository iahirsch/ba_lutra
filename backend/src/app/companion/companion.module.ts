import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Companion } from './companion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Companion])],
  exports: [TypeOrmModule],
})
export class CompanionModule {}
