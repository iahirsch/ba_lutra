import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'All stored activities' })
  findAll() {
    return this.activityService.findAll();
  }

  @Get('companion/:companionId')
  @ApiOperation({ summary: 'Activities for one companion' })
  findByCompanion(@Param('companionId') companionId: string) {
    return this.activityService.findByCompanion(companionId);
  }
}
