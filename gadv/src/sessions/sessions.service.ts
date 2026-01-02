import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Session } from '../entities/session.entity';
import { Article } from '../entities/article.entity';
import { Commande } from '../entities/commande.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
    private dataSource: DataSource,
  ) { }

  async findAll(articleId?: number): Promise<Session[]> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.article', 'article')
      .orderBy('session.date', 'ASC');

    if (articleId) {
      queryBuilder.where('session.article_id = :articleId', { articleId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['article'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async findByArticleId(articleId: number): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { article_id: articleId },
      relations: ['article'],
      order: { date: 'ASC' },
    });
  }

  async create(createSessionDto: CreateSessionDto, user?: any): Promise<Session> {
    // Verify article exists
    const article = await this.articleRepository.findOne({
      where: { id: createSessionDto.article_id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${createSessionDto.article_id} not found`);
    }

    // Check if session with same date already exists for this article
    const existingSession = await this.sessionRepository.findOne({
      where: {
        article_id: createSessionDto.article_id,
        date: new Date(createSessionDto.date),
      },
    });

    if (existingSession) {
      throw new BadRequestException(
        `Une session avec la date ${createSessionDto.date} existe déjà pour cet article`,
      );
    }

    const session = this.sessionRepository.create({
      article_id: createSessionDto.article_id,
      date: new Date(createSessionDto.date),
      nombre_place: createSessionDto.nombre_place,
      user_id: user?.id,
    });

    return this.sessionRepository.save(session);
  }

  async update(id: number, updateSessionDto: UpdateSessionDto, user?: any): Promise<Session> {
    const session = await this.findOne(id);

    // If article_id is being updated, verify new article exists
    if (updateSessionDto.article_id !== undefined && updateSessionDto.article_id !== session.article_id) {
      const article = await this.articleRepository.findOne({
        where: { id: updateSessionDto.article_id },
      });

      if (!article) {
        throw new NotFoundException(`Article with ID ${updateSessionDto.article_id} not found`);
      }
    }

    // If date is being updated, check for conflicts
    if (updateSessionDto.date !== undefined) {
      const newDate = new Date(updateSessionDto.date);
      const articleId = updateSessionDto.article_id ?? session.article_id;

      const existingSession = await this.sessionRepository.findOne({
        where: {
          article_id: articleId,
          date: newDate,
        },
      });

      if (existingSession && existingSession.id !== id) {
        throw new BadRequestException(
          `Une session avec la date ${updateSessionDto.date} existe déjà pour cet article`,
        );
      }
    }

    Object.assign(session, {
      ...(updateSessionDto.article_id !== undefined && { article_id: updateSessionDto.article_id }),
      ...(updateSessionDto.date !== undefined && { date: new Date(updateSessionDto.date) }),
      ...(updateSessionDto.nombre_place !== undefined && { nombre_place: updateSessionDto.nombre_place }),
      user_id: user?.id,
    });

    return this.sessionRepository.save(session);
  }

  async remove(id: number): Promise<void> {
    const session = await this.findOne(id);
    await this.sessionRepository.remove(session);
  }

  /**
   * Calculate remaining places for a session dynamically
   * place_restante = nombre_place - SUM(nombre_personnes) from all commandes
   * @param sessionId - The session ID
   * @param excludeCommandeId - Optional commande ID to exclude from calculation (for updates)
   * @returns The number of remaining places, or null if nombre_place is not set
   */
  async calculateRemainingPlaces(sessionId: number, excludeCommandeId?: number): Promise<number | null> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });

    if (!session || session.nombre_place === null || session.nombre_place === undefined) {
      return null;
    }

    const queryBuilder = this.commandeRepository
      .createQueryBuilder('commande')
      .select('COALESCE(SUM(commande.nombre_personnes), 0)', 'total_reserved')
      .where('commande.session_id = :sessionId', { sessionId })
      .andWhere('commande.nombre_personnes IS NOT NULL');

    if (excludeCommandeId) {
      queryBuilder.andWhere('commande.id != :excludeCommandeId', { excludeCommandeId });
    }

    const result = await queryBuilder.getRawOne();
    const totalReserved = result?.total_reserved ? parseInt(result.total_reserved, 10) : 0;
    const remaining = Math.max(0, session.nombre_place - totalReserved);

    return remaining;
  }
}

