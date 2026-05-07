import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { CompanionService } from './companion.service';
import { CreateCompanionConfigDto } from './dto/create-companion-config.dto';

@Controller('companion')
export class CompanionController {
  constructor(private readonly companionService: CompanionService) {}

  @Post('config')
  @HttpCode(201)
  create(@Body() dto: CreateCompanionConfigDto) {
    return this.companionService.create(dto);
  }

  @Get('config')
  findAll() {
    return this.companionService.findAll();
  }

  @Delete('config/:id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.companionService.delete(id);
  }
}
