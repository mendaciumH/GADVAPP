import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taxe } from '../entities/taxe.entity';
import { CreateTaxeDto } from './dto/create-taxe.dto';
import { UpdateTaxeDto } from './dto/update-taxe.dto';

@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(Taxe)
    private taxesRepository: Repository<Taxe>,
  ) { }

  async findAll(): Promise<Taxe[]> {
    return this.taxesRepository.find({
      relations: ['typeArticle'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Taxe> {
    const taxe = await this.taxesRepository.findOne({
      where: { id },
      relations: ['typeArticle'],
    });

    if (!taxe) {
      throw new NotFoundException(`Taxe with ID ${id} not found`);
    }

    return taxe;
  }

  async create(createTaxeDto: CreateTaxeDto, user?: any): Promise<Taxe> {
    const taxe = this.taxesRepository.create({
      id_type_article: createTaxeDto.id_type_article || undefined,
      reference: createTaxeDto.reference?.trim() || undefined,
      taxe_fixe: createTaxeDto.taxe_fixe ?? false,
      montant_taxe_fixe: createTaxeDto.montant_taxe_fixe || undefined,
      taxe_pourcentage: createTaxeDto.taxe_pourcentage || undefined,
      user_id: user?.id,
    });

    return this.taxesRepository.save(taxe);
  }

  async update(
    id: number,
    updateTaxeDto: UpdateTaxeDto,
    user?: any
  ): Promise<Taxe> {
    const taxe = await this.findOne(id);

    if (updateTaxeDto.id_type_article !== undefined) {
      (taxe as any).id_type_article = updateTaxeDto.id_type_article || undefined;
    }
    if (updateTaxeDto.reference !== undefined) {
      (taxe as any).reference = updateTaxeDto.reference?.trim() || undefined;
    }
    if (updateTaxeDto.taxe_fixe !== undefined) {
      (taxe as any).taxe_fixe = updateTaxeDto.taxe_fixe;
    }
    if (updateTaxeDto.montant_taxe_fixe !== undefined) {
      (taxe as any).montant_taxe_fixe = updateTaxeDto.montant_taxe_fixe || undefined;
    }
    if (updateTaxeDto.taxe_pourcentage !== undefined) {
      (taxe as any).taxe_pourcentage = updateTaxeDto.taxe_pourcentage || undefined;
    }

    (taxe as any).user_id = user?.id;

    return this.taxesRepository.save(taxe);
  }

  async remove(id: number): Promise<void> {
    const taxe = await this.findOne(id);
    await this.taxesRepository.remove(taxe);
  }
}


