import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Article } from '../entities/article.entity';
import { Commande } from '../entities/commande.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleSpecificHelper } from './helpers/article-specific.helper';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class ArticlesService {
  private specificHelper: ArticleSpecificHelper;

  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
    @Inject(forwardRef(() => SessionsService))
    private sessionsService: SessionsService,
    private dataSource: DataSource,
  ) {
    this.specificHelper = new ArticleSpecificHelper(dataSource);
  }

  /**
   * Extract only data fields from specific article entity, excluding relation fields and article_id
   */
  private extractSpecificDataFields(specificData: any): any {
    if (!specificData) return null;

    // Exclude relation fields and article_id
    const { article_id, article, compagnieAerienne, ...dataFields } = specificData;
    return dataFields;
  }

  /**
   * Calculate remaining places for an article dynamically
   * For OMRA articles: sum of all session remaining places
   * For other articles: returns null (legacy disponibilite removed)
   * @param articleId - The article ID
   * @returns The number of remaining places, or null if not applicable
   */
  private async calculateRemainingPlaces(articleId: number): Promise<number | null> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
      relations: ['sessions'],
    });

    if (!article) {
      return null;
    }

    // For OMRA articles (id_type_article === 1), calculate from sessions
    if (article.id_type_article === 1 && article.sessions && article.sessions.length > 0) {
      let totalRemaining = 0;
      for (const session of article.sessions) {
        const sessionRemaining = await this.sessionsService.calculateRemainingPlaces(session.id);
        if (sessionRemaining !== null) {
          totalRemaining += sessionRemaining;
        }
      }
      return totalRemaining;
    }

    // For other article types, return null (disponibilite field removed)
    return null;
  }

  async findAll(user?: any): Promise<Article[]> {
    let whereClause: any = {};

    // Permission Logic
    if (user) {
      const permissions: string[] = user.permissions || [];
      const roles: string[] = user.roles || [];
      const isAdmin = roles.some((r: string) => r.toLowerCase().includes('admin'));

      const hasGlobalAccess = isAdmin || permissions.includes('view_articles') || permissions.includes('manage_articles');
      const hasOmraAccess = permissions.includes('view_omra') || permissions.includes('manage_omra');

      if (hasGlobalAccess) {
        // Return all
      } else if (hasOmraAccess) {
        whereClause = { id_type_article: 1 };
      } else {
        // No access
        return [];
      }
    }

    const articles = await this.articleRepository.find({
      where: whereClause,
      relations: ['fournisseur', 'typeArticle', 'compagnieAerienne', 'sessions', 'chambres'],
      order: { id: 'DESC' },
    });

    // Load specific data and calculate remaining places for each article
    for (const article of articles) {
      if (article.id_type_article) {
        const specificData = await this.specificHelper.loadSpecificData(article.id, article.id_type_article);
        if (specificData) {
          // Merge specific data into article object, excluding relation fields and article_id
          const dataToMerge = this.extractSpecificDataFields(specificData);
          Object.assign(article, dataToMerge);
        }
      }

      // Calculate remaining places dynamically
      const remainingPlaces = await this.calculateRemainingPlaces(article.id);
      (article as any).places_restantes = remainingPlaces;

      // If article has sessions, calculate remaining places for each session
      if (article.sessions && article.sessions.length > 0) {
        const sessionsWithRemaining = await Promise.all(
          article.sessions.map(async (session) => {
            const sessionRemaining = await this.sessionsService.calculateRemainingPlaces(session.id);
            return {
              ...session,
              places_restantes: sessionRemaining,
            };
          }),
        );
        (article as any).sessions = sessionsWithRemaining;
      }
    }

    return articles;
  }

  async findAllServiceTourisme(user?: any): Promise<Article[]> {
    let whereClause: any = { id_type_article: Not(1) }; // Default: Exclude Omra

    // Permission Logic
    if (user) {
      const permissions: string[] = user.permissions || [];
      const roles: string[] = user.roles || [];
      const isAdmin = roles.some((r: string) => r.toLowerCase().includes('admin'));

      const hasGlobalAccess = isAdmin || permissions.includes('view_articles') || permissions.includes('manage_articles');

      if (!hasGlobalAccess) {
        // Only global access allows seeing Tourisme (non-Omra)
        // Even if they have view_omra, they shouldn't see Tourisme here
        return [];
      }
    }

    const articles = await this.articleRepository.find({
      where: whereClause,
      relations: ['fournisseur', 'typeArticle', 'compagnieAerienne', 'sessions', 'chambres'],
      order: { id: 'DESC' },
    });

    // Reuse the logic to load specific data and calculate remaining places
    for (const article of articles) {
      if (article.id_type_article) {
        const specificData = await this.specificHelper.loadSpecificData(article.id, article.id_type_article);
        if (specificData) {
          const dataToMerge = this.extractSpecificDataFields(specificData);
          Object.assign(article, dataToMerge);
        }
      }
      const remainingPlaces = await this.calculateRemainingPlaces(article.id);
      (article as any).places_restantes = remainingPlaces;
    }

    return articles;
  }

  async findPublished(): Promise<Article[]> {
    const articles = await this.articleRepository.find({
      where: { is_published: true, is_archiver: false },
      relations: ['fournisseur', 'typeArticle', 'compagnieAerienne', 'chambres'],
      order: { id: 'DESC' },
    });

    // Load specific data and calculate remaining places for each article
    for (const article of articles) {
      if (article.id_type_article) {
        const specificData = await this.specificHelper.loadSpecificData(article.id, article.id_type_article);
        if (specificData) {
          // Merge specific data into article object, excluding relation fields and article_id
          const dataToMerge = this.extractSpecificDataFields(specificData);
          Object.assign(article, dataToMerge);
        }
      }

      // Calculate remaining places dynamically
      const remainingPlaces = await this.calculateRemainingPlaces(article.id);
      (article as any).places_restantes = remainingPlaces;
    }

    return articles;
  }

  async findOnePublished(id: number): Promise<Article | null> {
    const article = await this.articleRepository.findOne({
      where: { id, is_published: true, is_archiver: false },
      relations: ['fournisseur', 'typeArticle', 'compagnieAerienne', 'sessions', 'chambres'],
    });

    if (article) {
      if (article.id_type_article) {
        const specificData = await this.specificHelper.loadSpecificData(id, article.id_type_article);
        if (specificData) {
          // Merge specific data into article object, excluding relation fields and article_id
          const dataToMerge = this.extractSpecificDataFields(specificData);
          Object.assign(article, dataToMerge);
        }
      }

      // Calculate remaining places dynamically
      const remainingPlaces = await this.calculateRemainingPlaces(id);
      (article as any).places_restantes = remainingPlaces;
    }

    return article;
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['fournisseur', 'typeArticle', 'compagnieAerienne', 'sessions', 'chambres'],
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Load specific data if type exists
    if (article.id_type_article) {
      const specificData = await this.specificHelper.loadSpecificData(id, article.id_type_article);
      if (specificData) {
        // Merge specific data into article object, excluding relation fields and article_id
        const dataToMerge = this.extractSpecificDataFields(specificData);
        Object.assign(article, dataToMerge);
      }
    }

    // Calculate remaining places dynamically (for articles without sessions)
    const remainingPlaces = await this.calculateRemainingPlaces(id);
    (article as any).places_restantes = remainingPlaces;

    // If article has sessions, calculate remaining places for each session
    if (article.sessions && article.sessions.length > 0) {
      const sessionsWithRemaining = await Promise.all(
        article.sessions.map(async (session) => {
          const sessionRemaining = await this.sessionsService.calculateRemainingPlaces(session.id);
          return {
            ...session,
            places_restantes: sessionRemaining,
          };
        }),
      );
      (article as any).sessions = sessionsWithRemaining;
    }

    return article;
  }

  async create(createArticleDto: CreateArticleDto, user?: any): Promise<Article> {
    const labelTrimmed = createArticleDto.label.trim();

    // Check if an article with the same label already exists
    const existingArticle = await this.articleRepository.findOne({
      where: { label: labelTrimmed },
    });

    if (existingArticle) {
      throw new BadRequestException(`Un service avec le libellé "${labelTrimmed}" existe déjà`);
    }

    const dateDepart = createArticleDto.date_depart ? new Date(createArticleDto.date_depart) : undefined;

    const dateRetour = createArticleDto.date_retour ? new Date(createArticleDto.date_retour) : undefined;

    // Create main article record
    const article = this.articleRepository.create({
      label: labelTrimmed,
      description: createArticleDto.description?.trim() || undefined,
      image_banner: createArticleDto.image_banner?.trim() || undefined,
      date_depart: dateDepart,
      date_retour: dateRetour,
      id_type_article: createArticleDto.id_type_article || undefined,
      fournisseur_id: createArticleDto.fournisseur_id || undefined,
      compagnie_aerienne_id: createArticleDto.compagnie_aerienne_id || undefined,
      commission: createArticleDto.commission || undefined,
      offre_limitee: createArticleDto.offre_limitee || false,
      prix_offre: createArticleDto.prix_offre || undefined,
      is_archiver: createArticleDto.is_archiver || false,
      is_published: createArticleDto.is_published || false,
      ville_depart: createArticleDto.ville_depart?.trim() || undefined,
      type_fly: createArticleDto.type_fly?.trim() || undefined,
      user_id: user?.id,
    });

    const savedArticle = await this.articleRepository.save(article);

    // Create sessions for OMRA articles (id_type_article === 1)
    // Always create at least one default session for OMRA articles
    if (savedArticle.id_type_article === 1) {
      let sessionsCreated = false;

      // Try to create sessions from sessions array (optional - user can add multiple dates)
      if (createArticleDto.sessions && Array.isArray(createArticleDto.sessions) && createArticleDto.sessions.length > 0) {
        for (const sessionData of createArticleDto.sessions) {
          if (sessionData.date && sessionData.nombre_place && sessionData.nombre_place > 0) {
            try {
              // Ensure date is in YYYY-MM-DD format (extract date part if it's a full ISO string)
              const dateStr = sessionData.date.split('T')[0];

              await this.sessionsService.create({
                article_id: savedArticle.id,
                date: dateStr,
                nombre_place: sessionData.nombre_place,
              });
              sessionsCreated = true;
              console.log(`Session created successfully: date=${dateStr}, places=${sessionData.nombre_place}`);
            } catch (error) {
              // Log error but don't fail article creation
              console.error('Error creating session:', error);
              console.error('Session data:', sessionData);
            }
          } else {
            console.warn('Skipping invalid session data:', sessionData);
          }
        }
      }

      // Always create a default session if no sessions were created from the array
      // This ensures every OMRA article has at least one session in the sessions table
      if (!sessionsCreated) {
        try {
          // Use date_depart if available, otherwise use current date
          let defaultDate: string;
          if (createArticleDto.date_depart) {
            defaultDate = typeof createArticleDto.date_depart === 'string'
              ? createArticleDto.date_depart.split('T')[0]
              : new Date(createArticleDto.date_depart).toISOString().split('T')[0];
          } else {
            // Use current date as default (required field in sessions table)
            defaultDate = new Date().toISOString().split('T')[0];
          }

          // Use 1 as minimum (required by validation) - user can update later via sessions
          const defaultPlaces = 1;

          await this.sessionsService.create({
            article_id: savedArticle.id,
            date: defaultDate,
            nombre_place: defaultPlaces,
          });
          console.log(`Default session created for OMRA article: date=${defaultDate}, places=${defaultPlaces}`);
        } catch (error) {
          console.error('Error creating default session for OMRA article:', error);
          // Don't throw - article creation should still succeed even if session creation fails
          // But log the error for debugging
        }
      }
    }

    // Save specific data if type is provided
    if (savedArticle.id_type_article) {
      await this.specificHelper.saveSpecificData(savedArticle.id, savedArticle.id_type_article, createArticleDto, user?.id);
      // Reload with specific data
      return this.findOne(savedArticle.id);
    }

    return savedArticle;
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
    user?: any
  ): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Update main article fields
    if (updateArticleDto.date_depart !== undefined) {
      article.date_depart = updateArticleDto.date_depart ? new Date(updateArticleDto.date_depart) : undefined;
    }
    if (updateArticleDto.label !== undefined) {
      const labelTrimmed = updateArticleDto.label.trim();

      // Check if another article (different from current) with the same label already exists
      // Use Not() to exclude the current article from the search
      const existingArticle = await this.articleRepository.findOne({
        where: {
          label: labelTrimmed,
          id: Not(id), // Exclude the current article
        },
      });

      // If an article with the same label exists (and it's not the current one), it's a duplicate
      if (existingArticle) {
        throw new BadRequestException(`Un service avec le libellé "${labelTrimmed}" existe déjà`);
      }

      article.label = labelTrimmed;
    }
    if (updateArticleDto.description !== undefined) {
      article.description = updateArticleDto.description?.trim() || undefined;
    }
    if (updateArticleDto.image_banner !== undefined) {
      article.image_banner = updateArticleDto.image_banner?.trim() || undefined;
    }
    if (updateArticleDto.id_type_article !== undefined) {
      article.id_type_article = updateArticleDto.id_type_article || undefined;
    }
    if (updateArticleDto.fournisseur_id !== undefined) {
      article.fournisseur_id = updateArticleDto.fournisseur_id || undefined;
    }
    if (updateArticleDto.commission !== undefined) {
      article.commission = updateArticleDto.commission || undefined;
    }
    if (updateArticleDto.offre_limitee !== undefined) {
      article.offre_limitee = updateArticleDto.offre_limitee;
    }
    if (updateArticleDto.prix_offre !== undefined) {
      article.prix_offre = updateArticleDto.prix_offre || undefined;
    }
    if (updateArticleDto.is_archiver !== undefined) {
      article.is_archiver = updateArticleDto.is_archiver;
    }

    if (user?.id) {
      article.user_id = user.id;
    }

    article.updated_at = new Date();
    if (updateArticleDto.is_published !== undefined) {
      article.is_published = updateArticleDto.is_published;
    }
    if (updateArticleDto.ville_depart !== undefined) {
      article.ville_depart = updateArticleDto.ville_depart?.trim() || undefined;
    }
    if (updateArticleDto.date_retour !== undefined) {
      article.date_retour = updateArticleDto.date_retour ? new Date(updateArticleDto.date_retour) : undefined;
    }
    if (updateArticleDto.compagnie_aerienne_id !== undefined) {
      article.compagnie_aerienne_id = updateArticleDto.compagnie_aerienne_id || undefined;
    }
    if (updateArticleDto.type_fly !== undefined) {
      article.type_fly = updateArticleDto.type_fly?.trim() || undefined;
    }

    const savedArticle = await this.articleRepository.save(article);

    // Update sessions for OMRA articles (id_type_article === 1)
    if (savedArticle.id_type_article === 1 && updateArticleDto.sessions !== undefined) {
      // Get existing sessions
      const existingSessions = await this.sessionsService.findByArticleId(savedArticle.id);
      const existingSessionIds = new Set(existingSessions.map(s => s.id));

      // Update or create sessions
      if (updateArticleDto.sessions && updateArticleDto.sessions.length > 0) {
        const newSessionIds = new Set<number>();

        for (const sessionData of updateArticleDto.sessions) {
          if (sessionData.date && sessionData.nombre_place) {
            // Check if session with this date already exists
            const existingSession = existingSessions.find(
              s => new Date(s.date).toISOString().split('T')[0] === sessionData.date.split('T')[0]
            );

            if (existingSession) {
              // Update existing session
              try {
                await this.sessionsService.update(existingSession.id, {
                  date: sessionData.date,
                  nombre_place: sessionData.nombre_place,
                });
                newSessionIds.add(existingSession.id);
              } catch (error) {
                console.error('Error updating session:', error);
              }
            } else {
              // Create new session
              try {
                const newSession = await this.sessionsService.create({
                  article_id: savedArticle.id,
                  date: sessionData.date,
                  nombre_place: sessionData.nombre_place,
                });
                newSessionIds.add(newSession.id);
              } catch (error) {
                console.error('Error creating session:', error);
              }
            }
          }
        }

        // Delete sessions that are no longer in the list
        for (const existingSession of existingSessions) {
          if (!newSessionIds.has(existingSession.id)) {
            try {
              await this.sessionsService.remove(existingSession.id);
            } catch (error) {
              console.error('Error deleting session:', error);
            }
          }
        }
      } else {
        // If sessions array is empty, delete all existing sessions
        for (const existingSession of existingSessions) {
          try {
            await this.sessionsService.remove(existingSession.id);
          } catch (error) {
            console.error('Error deleting session:', error);
          }
        }
      }
    }

    // Update specific data
    const typeId = updateArticleDto.id_type_article || article.id_type_article;
    if (typeId) {
      await this.specificHelper.saveSpecificData(savedArticle.id, typeId, updateArticleDto, user?.id);
    }

    // Reload with specific data
    return this.findOne(savedArticle.id);
  }

  async remove(id: number): Promise<void> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    // Delete specific data first (CASCADE will handle it, but explicit is better)
    if (article.id_type_article) {
      await this.specificHelper.deleteSpecificData(id, article.id_type_article);
    }

    await this.articleRepository.remove(article);
  }
}

