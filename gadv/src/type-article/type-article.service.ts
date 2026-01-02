import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeArticle } from '../entities/type-article.entity';
import { CreateTypeArticleDto } from './dto/create-type-article.dto';
import { UpdateTypeArticleDto } from './dto/update-type-article.dto';

@Injectable()
export class TypeArticleService {
  constructor(
    @InjectRepository(TypeArticle)
    private typeArticleRepository: Repository<TypeArticle>,
  ) {}

  async findAll(): Promise<TypeArticle[]> {
    return this.typeArticleRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<TypeArticle> {
    const typeArticle = await this.typeArticleRepository.findOne({
      where: { id },
    });

    if (!typeArticle) {
      throw new NotFoundException(`TypeArticle with ID ${id} not found`);
    }

    return typeArticle;
  }

  async create(createTypeArticleDto: CreateTypeArticleDto): Promise<TypeArticle> {
    const typeArticle = this.typeArticleRepository.create({
      description: createTypeArticleDto.description.trim(),
    });

    return this.typeArticleRepository.save(typeArticle);
  }

  async update(
    id: number,
    updateTypeArticleDto: UpdateTypeArticleDto,
  ): Promise<TypeArticle> {
    const typeArticle = await this.findOne(id);

    if (updateTypeArticleDto.description !== undefined) {
      typeArticle.description = updateTypeArticleDto.description.trim();
    }

    return this.typeArticleRepository.save(typeArticle);
  }

  async remove(id: number): Promise<void> {
    const typeArticle = await this.findOne(id);
    await this.typeArticleRepository.remove(typeArticle);
  }
}


