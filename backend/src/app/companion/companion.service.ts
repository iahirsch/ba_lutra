import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Companion } from './companion.entity';
import { CreateCompanionConfigDto } from './dto/create-companion-config.dto';
import { CompanionGateway } from './companion.gateway';

@Injectable()
export class CompanionService {
  constructor(
    @InjectRepository(Companion)
    private readonly companionRepository: Repository<Companion>,
    private readonly companionGateway: CompanionGateway,
  ) {}

  async create(dto: CreateCompanionConfigDto): Promise<Companion> {
    const companion = this.companionRepository.create({
      name: dto.name ?? 'My Companion',
      fur: dto.fur,
      eyes: dto.eyes,
      nose: dto.nose,
      clothing: dto.clothing ?? '',
      ears: dto.ears ?? '',
      tail: dto.tail ?? '',
      backpack: dto.backpack ?? '',
      bodyMorphs: dto.bodyMorphs ?? {},
    });
    return this.companionRepository.save(companion).then((saved) => {
      this.companionGateway.broadcastNewCompanion(saved);
      return saved;
    });
  }

  async findAll(): Promise<Companion[]> {
    return this.companionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    const companion = await this.companionRepository.findOneBy({ id });
    if (!companion) {
      throw new NotFoundException(`Companion ${id} not found`);
    }
    await this.companionRepository.delete(id);
    this.companionGateway.broadcastDeletedCompanion(id);
  }
}
