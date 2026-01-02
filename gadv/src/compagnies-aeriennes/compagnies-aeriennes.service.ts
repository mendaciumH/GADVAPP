import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompagnieAerienne } from '../entities/compagnie-aerienne.entity';
import { CreateCompagnieAerienneDto } from './dto/create-compagnie-aerienne.dto';
import { UpdateCompagnieAerienneDto } from './dto/update-compagnie-aerienne.dto';

@Injectable()
export class CompagniesAeriennesService {
  constructor(
    @InjectRepository(CompagnieAerienne)
    private compagnieAerienneRepository: Repository<CompagnieAerienne>,
  ) {}

  async findAll(): Promise<CompagnieAerienne[]> {
    return this.compagnieAerienneRepository.find({
      order: { nom: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CompagnieAerienne> {
    const compagnie = await this.compagnieAerienneRepository.findOne({
      where: { id },
    });

    if (!compagnie) {
      throw new NotFoundException(`Compagnie aérienne with ID ${id} not found`);
    }

    return compagnie;
  }

  async create(createCompagnieDto: CreateCompagnieAerienneDto): Promise<CompagnieAerienne> {
    const compagnie = this.compagnieAerienneRepository.create({
      nom: createCompagnieDto.nom.trim(),
      code_iata: createCompagnieDto.code_iata?.trim() || undefined,
      code_icao: createCompagnieDto.code_icao?.trim() || undefined,
    });

    return this.compagnieAerienneRepository.save(compagnie);
  }

  async update(
    id: number,
    updateCompagnieDto: UpdateCompagnieAerienneDto,
  ): Promise<CompagnieAerienne> {
    const compagnie = await this.findOne(id);

    if (updateCompagnieDto.nom !== undefined) {
      compagnie.nom = updateCompagnieDto.nom.trim();
    }
    if (updateCompagnieDto.code_iata !== undefined) {
      (compagnie as any).code_iata = updateCompagnieDto.code_iata?.trim() || undefined;
    }
    if (updateCompagnieDto.code_icao !== undefined) {
      (compagnie as any).code_icao = updateCompagnieDto.code_icao?.trim() || undefined;
    }

    return this.compagnieAerienneRepository.save(compagnie);
  }

  async remove(id: number): Promise<void> {
    const compagnie = await this.findOne(id);
    await this.compagnieAerienneRepository.remove(compagnie);
  }
}


