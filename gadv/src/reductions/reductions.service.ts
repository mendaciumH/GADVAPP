import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reduction } from '../entities/reduction.entity';
import { CreateReductionDto } from './dto/create-reduction.dto';
import { UpdateReductionDto } from './dto/update-reduction.dto';

@Injectable()
export class ReductionsService {
  constructor(
    @InjectRepository(Reduction)
    private reductionsRepository: Repository<Reduction>,
  ) { }

  async findAll(): Promise<Reduction[]> {
    return this.reductionsRepository.find({
      relations: ['typeArticle'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reduction> {
    const reduction = await this.reductionsRepository.findOne({
      where: { id },
      relations: ['typeArticle'],
    });

    if (!reduction) {
      throw new NotFoundException(`Reduction with ID ${id} not found`);
    }

    return reduction;
  }

  async create(createReductionDto: CreateReductionDto, user?: any): Promise<Reduction> {
    const reduction = this.reductionsRepository.create({
      type_article_id: createReductionDto.type_article_id || undefined,
      reference: createReductionDto.reference?.trim() || undefined,
      reduction_fixe: createReductionDto.reduction_fixe ?? false,
      montant_reduction_fixe: createReductionDto.montant_reduction_fixe || undefined,
      reduction_pourcentage: createReductionDto.reduction_pourcentage || undefined,
      user_id: user?.id,
    });

    return this.reductionsRepository.save(reduction);
  }

  async update(
    id: number,
    updateReductionDto: UpdateReductionDto,
    user?: any
  ): Promise<Reduction> {
    const reduction = await this.findOne(id);

    if (updateReductionDto.type_article_id !== undefined) {
      (reduction as any).type_article_id = updateReductionDto.type_article_id || undefined;
    }
    if (updateReductionDto.reference !== undefined) {
      (reduction as any).reference = updateReductionDto.reference?.trim() || undefined;
    }
    if (updateReductionDto.reduction_fixe !== undefined) {
      (reduction as any).reduction_fixe = updateReductionDto.reduction_fixe;
    }
    if (updateReductionDto.montant_reduction_fixe !== undefined) {
      (reduction as any).montant_reduction_fixe = updateReductionDto.montant_reduction_fixe || undefined;
    }
    if (updateReductionDto.reduction_pourcentage !== undefined) {
      (reduction as any).reduction_pourcentage = updateReductionDto.reduction_pourcentage || undefined;
    }

    (reduction as any).user_id = user?.id;

    return this.reductionsRepository.save(reduction);
  }

  async remove(id: number): Promise<void> {
    const reduction = await this.findOne(id);
    await this.reductionsRepository.remove(reduction);
  }
}


