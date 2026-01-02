import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { Commande } from '../entities/commande.entity';
import { Article } from '../entities/article.entity';
import { Session } from '../entities/session.entity';
import { Facture } from '../entities/facture.entity';
import { BonDeVersement } from '../entities/bon-de-versement.entity';
import { User } from '../entities/user.entity';
import { FacturesService } from '../factures/factures.service';
import { SessionsService } from '../sessions/sessions.service';
import { NumerotationsService } from '../numerotations/numerotations.service';
import { NumerotationType } from '../entities/numerotation.entity';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';
import { BonDeRemboursementService } from '../bon-de-remboursement/bon-de-remboursement.service';

export interface CommandeWithDetails extends Commande {
  total_factures?: number;
  total_versements?: number;
}

@Injectable()
export class CommandesService {
  constructor(
    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Facture)
    private factureRepository: Repository<Facture>,
    @InjectRepository(BonDeVersement)
    private bonDeVersementRepository: Repository<BonDeVersement>,
    @Inject(forwardRef(() => FacturesService))
    private facturesService: FacturesService,
    @Inject(forwardRef(() => SessionsService))
    private sessionsService: SessionsService,
    @Inject(forwardRef(() => BonDeRemboursementService))
    private bonDeRemboursementService: BonDeRemboursementService,
    private numerotationsService: NumerotationsService,
    private dataSource: DataSource,
  ) { }

  /**
   * Calculate remaining places for a session dynamically
   * place_restante = nombre_place - SUM(nombre_personnes) from all commandes
   * @param sessionId - The session ID
   * @param excludeCommandeId - Optional commande ID to exclude from calculation (for updates)
   * @returns The number of remaining places, or null if nombre_place is not set
   */
  async calculateRemainingPlaces(sessionId: number, excludeCommandeId?: number): Promise<number | null> {
    return this.sessionsService.calculateRemainingPlaces(sessionId, excludeCommandeId);
  }

  async findAll(user?: any): Promise<Commande[]> {
    let whereClause: any = {};

    // Permission Logic
    if (user) {
      const permissions: string[] = user.permissions || [];
      const roles: string[] = user.roles || [];
      const isAdmin = roles.some((r: string) => r.toLowerCase().includes('admin'));

      const hasGlobalAccess = isAdmin || permissions.includes('view_commandes') || permissions.includes('manage_commandes');
      const hasOmraAccess = permissions.includes('view_omra') || permissions.includes('manage_omra');

      if (hasGlobalAccess) {
        // Return all
      } else if (hasOmraAccess) {
        whereClause = { article: { id_type_article: 1 } };
      } else {
        return [];
      }
    }

    return this.commandeRepository.find({
      where: whereClause,
      relations: ['client', 'article', 'user', 'session', 'chambre'],
      order: { id: 'DESC' },
    });
  }

  async findAllOmra(user?: any): Promise<Commande[]> {
    // Check permissions
    if (user) {
      const permissions: string[] = user.permissions || [];
      const roles: string[] = user.roles || [];
      const isAdmin = roles.some((r: string) => r.toLowerCase().includes('admin'));

      const hasGlobalAccess = isAdmin || permissions.includes('view_commandes') || permissions.includes('manage_commandes');
      const hasOmraAccess = permissions.includes('view_omra') || permissions.includes('manage_omra');

      if (!hasGlobalAccess && !hasOmraAccess) {
        return [];
      }
    }

    return this.commandeRepository.find({
      where: { article: { id_type_article: 1 } },
      relations: ['client', 'article', 'user', 'session', 'chambre'],
      order: { id: 'DESC' },
    });
  }

  async findAllTourisme(user?: any): Promise<Commande[]> {
    // Check permissions - Tourisme is only for global view (legacy logic implication)
    if (user) {
      const permissions: string[] = user.permissions || [];
      const roles: string[] = user.roles || [];
      const isAdmin = roles.some((r: string) => r.toLowerCase().includes('admin'));

      const hasGlobalAccess = isAdmin || permissions.includes('view_commandes') || permissions.includes('manage_commandes');

      if (!hasGlobalAccess) {
        return [];
      }
    }

    return this.commandeRepository.find({
      where: { article: { id_type_article: Not(1) } }, // Exclude Omra (type 1)
      relations: ['client', 'article', 'user', 'session', 'chambre'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Commande> {
    const commande = await this.commandeRepository.findOne({
      where: { id },
      relations: ['client', 'article', 'session', 'user', 'chambre'],
    });

    if (!commande) {
      throw new NotFoundException(`Commande with ID ${id} not found`);
    }

    return commande;
  }

  async create(createCommandeDto: CreateCommandeDto, user?: User): Promise<Commande> {
    const commandeData = createCommandeDto;
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!commandeData.client_id) {
      errors.client_id = 'Le client est requis';
    }

    if (!commandeData.article_id) {
      errors.article_id = 'L\'article est requis';
    }

    // Validate numeric fields (decimal(10,2) = max 99999999.99)
    const MAX_DECIMAL_VALUE = 99999999.99;
    const MIN_DECIMAL_VALUE = -99999999.99;

    if (commandeData.prix !== undefined && commandeData.prix !== null) {
      if (commandeData.prix > MAX_DECIMAL_VALUE || commandeData.prix < MIN_DECIMAL_VALUE) {
        errors.prix = `Le prix doit être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.prix)) {
        errors.prix = 'Le prix doit être un nombre valide';
      }
    }

    if (commandeData.reductions !== undefined && commandeData.reductions !== null) {
      if (commandeData.reductions > MAX_DECIMAL_VALUE || commandeData.reductions < MIN_DECIMAL_VALUE) {
        errors.reductions = `Les réductions doivent être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.reductions)) {
        errors.reductions = 'Les réductions doivent être un nombre valide';
      }
    }

    if (commandeData.autre_reductions !== undefined && commandeData.autre_reductions !== null) {
      if (commandeData.autre_reductions > MAX_DECIMAL_VALUE || commandeData.autre_reductions < MIN_DECIMAL_VALUE) {
        errors.autre_reductions = `Les autres réductions doivent être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.autre_reductions)) {
        errors.autre_reductions = 'Les autres réductions doivent être un nombre valide';
      }
    }

    if (commandeData.taxes !== undefined && commandeData.taxes !== null) {
      if (commandeData.taxes > MAX_DECIMAL_VALUE || commandeData.taxes < MIN_DECIMAL_VALUE) {
        errors.taxes = `Les taxes doivent être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.taxes)) {
        errors.taxes = 'Les taxes doivent être un nombre valide';
      }
    }

    // Validate nom and prenom if beneficiaire is true
    if (commandeData.beneficiaire) {
      if (!commandeData.nom?.trim()) {
        errors.nom = 'Le nom du bénéficiaire est requis';
      }
      if (!commandeData.prenom?.trim()) {
        errors.prenom = 'Le prénom du bénéficiaire est requis';
      }
    }

    // Validate nombre_personnes and check remaining places if provided
    if (commandeData.nombre_personnes !== undefined && commandeData.nombre_personnes !== null) {
      if (commandeData.nombre_personnes < 1) {
        errors.nombre_personnes = 'Le nombre de personnes doit être au moins 1';
      }

      // Check remaining places dynamically if session_id is provided (preferred for OMRA)
      if (commandeData.session_id) {
        const remainingPlaces = await this.calculateRemainingPlaces(commandeData.session_id);
        if (remainingPlaces !== null && commandeData.nombre_personnes > remainingPlaces) {
          errors.nombre_personnes = `Le nombre de personnes (${commandeData.nombre_personnes}) dépasse la disponibilité (${remainingPlaces} places restantes)`;
        }
      } else if (commandeData.article_id) {
        // Fallback: For OMRA articles without session_id, try to use first available session
        const article = await this.articleRepository.findOne({
          where: { id: commandeData.article_id },
          relations: ['sessions'],
        });

        if (article && article.id_type_article === 1) {
          // For OMRA articles, try to find a session to use for calculation
          if (article.sessions && article.sessions.length > 0) {
            // Use the first session for calculation (or could use date_depart matching)
            const firstSession = article.sessions[0];
            const remainingPlaces = await this.calculateRemainingPlaces(firstSession.id);
            if (remainingPlaces !== null && commandeData.nombre_personnes > remainingPlaces) {
              errors.nombre_personnes = `Le nombre de personnes (${commandeData.nombre_personnes}) dépasse la disponibilité (${remainingPlaces} places restantes). Veuillez sélectionner une session spécifique.`;
            }
          } else {
            // No sessions available - require session_id
            errors.nombre_personnes = 'Pour les articles Omra, veuillez sélectionner une session (date de départ)';
          }
        }
        // For other article types, no availability check (disponibilite field removed)
      }
    }

    // Throw error with all validation errors
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Erreurs de validation',
        errors,
      });
    }

    // Convert date strings to Date objects
    const date = commandeData.date ? new Date(commandeData.date) : new Date();
    const dateNaissance = commandeData.date_naissance ? new Date(commandeData.date_naissance) : null;
    const dateExpirationPassport = commandeData.date_expiration_passport ? new Date(commandeData.date_expiration_passport) : null;

    // Use transaction with row-level lock to prevent race conditions
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let sessionToLock: Session | null = null;

      // Lock the session row to prevent concurrent modifications (preferred for OMRA)
      if (commandeData.session_id && commandeData.nombre_personnes) {
        sessionToLock = await queryRunner.manager
          .createQueryBuilder(Session, 'session')
          .setLock('pessimistic_write')
          .where('session.id = :id', { id: commandeData.session_id })
          .getOne();

        if (!sessionToLock) {
          throw new NotFoundException(`Session with ID ${commandeData.session_id} not found`);
        }

        // Re-check remaining places with lock to ensure consistency
        const remainingPlaces = await this.calculateRemainingPlaces(commandeData.session_id);
        if (remainingPlaces !== null && commandeData.nombre_personnes > remainingPlaces) {
          throw new BadRequestException({
            message: 'Erreurs de validation',
            errors: {
              nombre_personnes: `Le nombre de personnes (${commandeData.nombre_personnes}) dépasse la disponibilité (${remainingPlaces} places restantes)`,
            },
          });
        }
      } else if (commandeData.article_id && commandeData.nombre_personnes) {
        // Fallback: For OMRA articles, try to lock first available session
        const article = await queryRunner.manager
          .createQueryBuilder(Article, 'article')
          .setLock('pessimistic_write')
          .where('article.id = :id', { id: commandeData.article_id })
          .leftJoinAndSelect('article.sessions', 'sessions')
          .getOne();

        if (!article) {
          throw new NotFoundException(`Article with ID ${commandeData.article_id} not found`);
        }

        // If OMRA article, lock the first session for calculation
        if (article.id_type_article === 1 && article.sessions && article.sessions.length > 0) {
          const firstSessionId = article.sessions[0].id;
          sessionToLock = await queryRunner.manager
            .createQueryBuilder(Session, 'session')
            .setLock('pessimistic_write')
            .where('session.id = :id', { id: firstSessionId })
            .getOne();

          if (sessionToLock) {
            // Re-check remaining places with lock
            const remainingPlaces = await this.calculateRemainingPlaces(firstSessionId);
            if (remainingPlaces !== null && commandeData.nombre_personnes > remainingPlaces) {
              throw new BadRequestException({
                message: 'Erreurs de validation',
                errors: {
                  nombre_personnes: `Le nombre de personnes (${commandeData.nombre_personnes}) dépasse la disponibilité (${remainingPlaces} places restantes). Veuillez sélectionner une session spécifique.`,
                },
              });
            }
          }
        }
      }

      const commandeDataToSave = {
        client_id: commandeData.client_id,
        article_id: commandeData.article_id,
        session_id: commandeData.session_id,
        date: date,
        beneficiaire: commandeData.beneficiaire || false,
        nom: commandeData.nom?.trim() || null,
        prenom: commandeData.prenom?.trim() || null,
        date_naissance: dateNaissance,
        genre: commandeData.genre?.trim() || null,
        numero_passport: commandeData.numero_passport?.trim() || null,
        date_expiration_passport: dateExpirationPassport,
        numero_mobile: commandeData.numero_mobile?.trim() || null,
        remarques: commandeData.remarques?.trim() || null,
        prix: commandeData.prix || null,
        reductions: commandeData.reductions || null,
        autre_reductions: commandeData.autre_reductions || null,
        taxes: commandeData.taxes || null,
        nombre_personnes: commandeData.nombre_personnes || null,
        chambre_id: commandeData.chambre_id || null, // Persist chambre_id
        user: user,
      } as Commande;

      console.log('creation commande payload:', {
        received_chambre_id: commandeData.chambre_id,
        saving_chambre_id: commandeDataToSave.chambre_id
      });

      // Generate numero_bon_commande
      const numeroBonCommande = await this.numerotationsService.getNextNumber(NumerotationType.BON_COMMANDE);
      commandeDataToSave.numero_bon_commande = numeroBonCommande;

      const savedCommande = await queryRunner.manager.save(Commande, commandeDataToSave);

      await queryRunner.commitTransaction();

      // If facturer is true, generate invoice automatically (outside transaction)
      if (commandeData.facturer) {
        try {
          await this.facturesService.generateFromCommande(savedCommande.id);
        } catch (error) {
          // Log error but don't fail the commande creation
          console.error('Error generating invoice:', error);
        }
      }

      return this.findOne(savedCommande.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      // Handle database errors
      if (error.code === '22003' || error.code === '22001') {
        // Numeric value out of range or string data too long
        const fieldErrors: Record<string, string> = {};

        if (error.message?.includes('prix') || error.detail?.includes('prix')) {
          fieldErrors.prix = 'Le prix dépasse la limite autorisée (maximum 99 999 999.99 DA)';
        }
        if (error.message?.includes('reductions') || error.detail?.includes('reductions')) {
          fieldErrors.reductions = 'Les réductions dépassent la limite autorisée (maximum 99 999 999.99 DA)';
        }
        if (error.message?.includes('autre_reductions') || error.detail?.includes('autre_reductions')) {
          fieldErrors.autre_reductions = 'Les autres réductions dépassent la limite autorisée (maximum 99 999 999.99 DA)';
        }
        if (error.message?.includes('taxes') || error.detail?.includes('taxes')) {
          fieldErrors.taxes = 'Les taxes dépassent la limite autorisée (maximum 99 999 999.99 DA)';
        }

        if (Object.keys(fieldErrors).length > 0) {
          throw new BadRequestException({
            message: 'Erreurs de validation',
            errors: fieldErrors,
          });
        }
      }

      // Re-throw if it's already a BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For other errors, throw a generic error
      throw new BadRequestException({
        message: error.message || 'Erreur lors de la création de la commande',
        errors: {},
      });
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: number,
    updateCommandeDto: UpdateCommandeDto,
    user?: any
  ): Promise<Commande> {
    const commandeData = updateCommandeDto;
    const errors: Record<string, string> = {};
    const MAX_DECIMAL_VALUE = 99999999.99;
    const MIN_DECIMAL_VALUE = -99999999.99;

    // Validate numeric fields if provided
    if (commandeData.prix !== undefined && commandeData.prix !== null) {
      if (commandeData.prix > MAX_DECIMAL_VALUE || commandeData.prix < MIN_DECIMAL_VALUE) {
        errors.prix = `Le prix doit être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.prix)) {
        errors.prix = 'Le prix doit être un nombre valide';
      }
    }

    if (commandeData.reductions !== undefined && commandeData.reductions !== null) {
      if (commandeData.reductions > MAX_DECIMAL_VALUE || commandeData.reductions < MIN_DECIMAL_VALUE) {
        errors.reductions = `Les réductions doivent être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.reductions)) {
        errors.reductions = 'Les réductions doivent être un nombre valide';
      }
    }

    if (commandeData.autre_reductions !== undefined && commandeData.autre_reductions !== null) {
      if (commandeData.autre_reductions > MAX_DECIMAL_VALUE || commandeData.autre_reductions < MIN_DECIMAL_VALUE) {
        errors.autre_reductions = `Les autres réductions doivent être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.autre_reductions)) {
        errors.autre_reductions = 'Les autres réductions doivent être un nombre valide';
      }
    }

    if (commandeData.taxes !== undefined && commandeData.taxes !== null) {
      if (commandeData.taxes > MAX_DECIMAL_VALUE || commandeData.taxes < MIN_DECIMAL_VALUE) {
        errors.taxes = `Les taxes doivent être entre ${MIN_DECIMAL_VALUE.toLocaleString('fr-FR')} et ${MAX_DECIMAL_VALUE.toLocaleString('fr-FR')} DA`;
      }
      if (isNaN(commandeData.taxes)) {
        errors.taxes = 'Les taxes doivent être un nombre valide';
      }
    }

    // Validate nom and prenom if beneficiaire is true
    if (commandeData.beneficiaire) {
      if (commandeData.nom !== undefined && !commandeData.nom?.trim()) {
        errors.nom = 'Le nom du bénéficiaire est requis';
      }
      if (commandeData.prenom !== undefined && !commandeData.prenom?.trim()) {
        errors.prenom = 'Le prénom du bénéficiaire est requis';
      }
    }

    // Validate nombre_personnes if provided
    if (commandeData.nombre_personnes !== undefined && commandeData.nombre_personnes !== null) {
      if (commandeData.nombre_personnes < 1) {
        errors.nombre_personnes = 'Le nombre de personnes doit être au moins 1';
      }
    }

    // Throw error with all validation errors
    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Erreurs de validation',
        errors,
      });
    }

    const commande = await this.findOne(id);

    // Get old values
    const oldNombrePersonnes = commande.nombre_personnes || 0;
    const oldSessionId = commande.session_id;
    const oldArticleId = commande.article_id;
    const newSessionId = commandeData.session_id !== undefined ? commandeData.session_id : oldSessionId;
    const newArticleId = commandeData.article_id !== undefined ? commandeData.article_id : oldArticleId;
    const newNombrePersonnes = commandeData.nombre_personnes !== undefined ? commandeData.nombre_personnes : oldNombrePersonnes;

    // Check remaining places dynamically for new session if nombre_personnes or session_id changed (preferred for OMRA)
    if ((commandeData.nombre_personnes !== undefined || commandeData.session_id !== undefined) && newSessionId) {
      // Calculate remaining places excluding current commande (since we're updating it)
      const remainingPlaces = await this.calculateRemainingPlaces(newSessionId, id);
      if (remainingPlaces !== null) {
        // If same session, we need to add back the old nombre_personnes to get true remaining
        const actualRemaining = oldSessionId === newSessionId && oldNombrePersonnes
          ? remainingPlaces + oldNombrePersonnes
          : remainingPlaces;

        if (newNombrePersonnes > actualRemaining) {
          errors.nombre_personnes = `Le nombre de personnes (${newNombrePersonnes}) dépasse la disponibilité (${actualRemaining} places disponibles)`;
          throw new BadRequestException({
            message: 'Erreurs de validation',
            errors,
          });
        }
      }
    } else if ((commandeData.nombre_personnes !== undefined || commandeData.article_id !== undefined) && newArticleId) {
      // Fallback: For OMRA articles without session_id, try to use first available session
      const article = await this.articleRepository.findOne({
        where: { id: newArticleId },
        relations: ['sessions'],
      });

      if (article && article.id_type_article === 1) {
        // For OMRA articles, try to find a session to use for calculation
        if (article.sessions && article.sessions.length > 0) {
          // Use the first session for calculation (or could use date_depart matching)
          const firstSession = article.sessions[0];
          const remainingPlaces = await this.calculateRemainingPlaces(firstSession.id, id);
          if (remainingPlaces !== null) {
            // If same article, we need to add back the old nombre_personnes to get true remaining
            const actualRemaining = oldArticleId === newArticleId && oldNombrePersonnes && oldSessionId === firstSession.id
              ? remainingPlaces + oldNombrePersonnes
              : remainingPlaces;

            if (newNombrePersonnes > actualRemaining) {
              errors.nombre_personnes = `Le nombre de personnes (${newNombrePersonnes}) dépasse la disponibilité (${actualRemaining} places disponibles). Veuillez sélectionner une session spécifique.`;
              throw new BadRequestException({
                message: 'Erreurs de validation',
                errors,
              });
            }
          }
        } else {
          // No sessions available - require session_id
          errors.nombre_personnes = 'Pour les articles Omra, veuillez sélectionner une session (date de départ)';
          throw new BadRequestException({
            message: 'Erreurs de validation',
            errors,
          });
        }
      }
      // For other article types, no availability check (disponibilite field removed)
    }

    // Convert date strings to Date objects if provided
    let date: Date = commande.date || new Date();
    if (commandeData.date !== undefined) {
      date = commandeData.date ? new Date(commandeData.date) : new Date();
    }

    let dateNaissance: Date | null = commande.date_naissance;
    if (commandeData.date_naissance !== undefined) {
      dateNaissance = commandeData.date_naissance ? new Date(commandeData.date_naissance) : null;
    }

    let dateExpirationPassport: Date | null = commande.date_expiration_passport;
    if (commandeData.date_expiration_passport !== undefined) {
      dateExpirationPassport = commandeData.date_expiration_passport ? new Date(commandeData.date_expiration_passport) : null;
    }

    // Use transaction with row-level lock to prevent race conditions
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let sessionToLock: Session | null = null;

      // Lock the session row if nombre_personnes or session_id changed (preferred for OMRA)
      if ((commandeData.nombre_personnes !== undefined || commandeData.session_id !== undefined) && newSessionId) {
        sessionToLock = await queryRunner.manager
          .createQueryBuilder(Session, 'session')
          .setLock('pessimistic_write')
          .where('session.id = :id', { id: newSessionId })
          .getOne();

        if (!sessionToLock) {
          throw new NotFoundException(`Session with ID ${newSessionId} not found`);
        }

        // Re-check remaining places with lock to ensure consistency
        const remainingPlaces = await this.calculateRemainingPlaces(newSessionId, id);
        if (remainingPlaces !== null) {
          const actualRemaining = oldSessionId === newSessionId && oldNombrePersonnes
            ? remainingPlaces + oldNombrePersonnes
            : remainingPlaces;

          if (newNombrePersonnes > actualRemaining) {
            throw new BadRequestException({
              message: 'Erreurs de validation',
              errors: {
                nombre_personnes: `Le nombre de personnes (${newNombrePersonnes}) dépasse la disponibilité (${actualRemaining} places disponibles)`,
              },
            });
          }
        }
      } else if ((commandeData.nombre_personnes !== undefined || commandeData.article_id !== undefined) && newArticleId) {
        // Fallback: For OMRA articles, try to lock first available session
        const article = await queryRunner.manager
          .createQueryBuilder(Article, 'article')
          .setLock('pessimistic_write')
          .where('article.id = :id', { id: newArticleId })
          .leftJoinAndSelect('article.sessions', 'sessions')
          .getOne();

        if (!article) {
          throw new NotFoundException(`Article with ID ${newArticleId} not found`);
        }

        // If OMRA article, lock the first session for calculation
        if (article.id_type_article === 1 && article.sessions && article.sessions.length > 0) {
          const firstSessionId = article.sessions[0].id;
          sessionToLock = await queryRunner.manager
            .createQueryBuilder(Session, 'session')
            .setLock('pessimistic_write')
            .where('session.id = :id', { id: firstSessionId })
            .getOne();

          if (sessionToLock) {
            // Re-check remaining places with lock
            const remainingPlaces = await this.calculateRemainingPlaces(
              firstSessionId,
              oldSessionId === firstSessionId ? id : undefined
            );
            if (remainingPlaces !== null) {
              const actualRemaining = oldSessionId === firstSessionId && oldNombrePersonnes
                ? remainingPlaces + oldNombrePersonnes
                : remainingPlaces;

              if (newNombrePersonnes > actualRemaining) {
                throw new BadRequestException({
                  message: 'Erreurs de validation',
                  errors: {
                    nombre_personnes: `Le nombre de personnes (${newNombrePersonnes}) dépasse la disponibilité (${actualRemaining} places disponibles). Veuillez sélectionner une session spécifique.`,
                  },
                });
              }
            }
          }
        }
      }

      Object.assign(commande, {
        ...(commandeData.client_id !== undefined && { client_id: commandeData.client_id }),
        ...(commandeData.article_id !== undefined && { article_id: commandeData.article_id }),
        ...(commandeData.session_id !== undefined && { session_id: commandeData.session_id }),
        ...(commandeData.date !== undefined && { date: date }),
        ...(commandeData.beneficiaire !== undefined && { beneficiaire: commandeData.beneficiaire }),
        ...(commandeData.nom !== undefined && { nom: commandeData.nom?.trim() || null }),
        ...(commandeData.prenom !== undefined && { prenom: commandeData.prenom?.trim() || null }),
        ...(commandeData.date_naissance !== undefined && { date_naissance: dateNaissance }),
        ...(commandeData.genre !== undefined && { genre: commandeData.genre?.trim() || null }),
        ...(commandeData.numero_passport !== undefined && { numero_passport: commandeData.numero_passport?.trim() || null }),
        ...(commandeData.date_expiration_passport !== undefined && { date_expiration_passport: dateExpirationPassport }),
        ...(commandeData.numero_mobile !== undefined && { numero_mobile: commandeData.numero_mobile?.trim() || null }),
        ...(commandeData.remarques !== undefined && { remarques: commandeData.remarques?.trim() || null }),
        ...(commandeData.prix !== undefined && { prix: commandeData.prix || null }),
        ...(commandeData.reductions !== undefined && { reductions: commandeData.reductions || null }),
        ...(commandeData.autre_reductions !== undefined && { autre_reductions: commandeData.autre_reductions || null }),
        ...(commandeData.taxes !== undefined && { taxes: commandeData.taxes || null }),
        ...(commandeData.taxes !== undefined && { taxes: commandeData.taxes || null }),
        ...(commandeData.nombre_personnes !== undefined && { nombre_personnes: commandeData.nombre_personnes || null }),
        ...(commandeData.chambre_id !== undefined && { chambre_id: commandeData.chambre_id || null }),
        user_id: user?.id,
      });

      const savedCommande = await queryRunner.manager.save(commande);

      await queryRunner.commitTransaction();

      // If facturer is true, generate invoice automatically (outside transaction)
      if (commandeData.facturer) {
        try {
          await this.facturesService.generateFromCommande(savedCommande.id);
        } catch (error) {
          // Log error but don't fail the commande update
          console.error('Error generating invoice:', error);
        }
      }

      return this.findOne(savedCommande.id);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      // Handle database errors
      if (error.code === '22003' || error.code === '22001') {
        // Numeric value out of range or string data too long
        const fieldErrors: Record<string, string> = {};

        if (error.message?.includes('prix') || error.detail?.includes('prix')) {
          fieldErrors.prix = 'Le prix dépasse la limite autorisée (maximum 99 999 999.99 DA)';
        }
        if (error.message?.includes('reductions') || error.detail?.includes('reductions')) {
          fieldErrors.reductions = 'Les réductions dépassent la limite autorisée (maximum 99 999 999.99 DA)';
        }
        if (error.message?.includes('autre_reductions') || error.detail?.includes('autre_reductions')) {
          fieldErrors.autre_reductions = 'Les autres réductions dépassent la limite autorisée (maximum 99 999 999.99 DA)';
        }
        if (error.message?.includes('taxes') || error.detail?.includes('taxes')) {
          fieldErrors.taxes = 'Les taxes dépassent la limite autorisée (maximum 99 999 999.99 DA)';
        }

        if (Object.keys(fieldErrors).length > 0) {
          throw new BadRequestException({
            message: 'Erreurs de validation',
            errors: fieldErrors,
          });
        }
      }

      // Re-throw if it's already a BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For other errors, throw a generic error
      throw new BadRequestException({
        message: error.message || 'Erreur lors de la mise à jour de la commande',
        errors: {},
      });
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    const commande = await this.findOne(id);

    // No need to update disponibilite - remaining places are calculated dynamically
    await this.commandeRepository.remove(commande);
  }

  // ============================================
  // CANCEL COMMANDE METHODS
  // ============================================

  /**
   * Get commande with all related factures and versements
   */
  async findOneWithDetails(id: number): Promise<CommandeWithDetails> {
    const commande = await this.commandeRepository.findOne({
      where: { id },
      relations: ['client', 'article', 'factures', 'bons_de_versement', 'session', 'chambre'],
    });

    if (!commande) {
      throw new NotFoundException(`Commande with ID ${id} not found`);
    }

    return {
      ...commande,
      total_factures: (commande.factures || []).length,
      total_versements: (commande.bons_de_versement || []).length,
    };
  }

  /**
   * Cancel a commande and all its related factures and versements
   * Creates a bon de remboursement for the total paid amount (from both BonDeVersement and CaisseTransaction)
   * @param id - Commande ID
   * @param userId - User ID who is performing the cancellation (for tracking in caisse transaction)
   */
  async cancelCommande(id: number, userId?: number): Promise<CommandeWithDetails> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get commande with factures and versements
      const commande = await this.commandeRepository.findOne({
        where: { id },
        relations: ['client', 'article', 'factures', 'bons_de_versement'],
      });

      if (!commande) {
        throw new NotFoundException(`Commande with ID ${id} not found`);
      }

      // Check if commande is already cancelled
      const factures = commande.factures || [];
      const allFacturesCancelled = factures.length > 0 && factures.every(f => f.statut === 'annulee');

      if (allFacturesCancelled) {
        throw new BadRequestException('Cette commande est déjà annulée');
      }

      // ============================================
      // CALCULATE TOTAL PAID FROM ALL SOURCES
      // ============================================

      // 1. Calculate total from BonDeVersement (advance payments on commande)
      const versements = commande.bons_de_versement || [];
      const totalFromBonDeVersement = versements
        .filter(v => !v.annule)
        .reduce((sum, v) => sum + Number(v.montant_verse), 0);

      // 2. Calculate total from CaisseTransaction (direct facture payments)
      let totalFromCaisseTransactions = 0;
      for (const facture of factures) {
        const facturePayments = await queryRunner.manager
          .createQueryBuilder('caisse_transactions', 'ct')
          .select('COALESCE(SUM(ct.montant), 0)', 'total')
          .where('ct.reference_type = :refType', { refType: 'facture' })
          .andWhere('ct.reference_id = :factureId', { factureId: facture.id })
          .andWhere('ct.type = :type', { type: 'encaissement' })
          .getRawOne();

        totalFromCaisseTransactions += Number(facturePayments?.total) || 0;
      }

      // 3. Total amount to refund
      const totalPaid = totalFromBonDeVersement + totalFromCaisseTransactions;

      // ============================================
      // CREATE BON DE REMBOURSEMENT WITH CAISSE TRANSACTION
      // ============================================

      // Create bon de remboursement if there were payments
      // This will automatically create a DÉCAISSEMENT transaction in the caisse
      if (totalPaid > 0) {
        const motif = [
          `Annulation de la commande #${commande.id}`,
          totalFromBonDeVersement > 0 ? `BonDeVersement: ${totalFromBonDeVersement.toFixed(2)} DA` : null,
          totalFromCaisseTransactions > 0 ? `Paiements Facture: ${totalFromCaisseTransactions.toFixed(2)} DA` : null,
          `Total remboursé: ${totalPaid.toFixed(2)} DA`
        ].filter(Boolean).join(' | ');

        await this.bonDeRemboursementService.create({
          client_id: commande.client_id,
          commande_id: commande.id,
          montant: totalPaid,
          motif: motif,
          date_remboursement: new Date().toISOString(),
        }, userId);
      }

      // ============================================
      // CANCEL FACTURES AND VERSEMENTS
      // ============================================

      // Set commande status to annulee
      const commandeToUpdate = await queryRunner.manager.findOne(Commande, {
        where: { id: commande.id },
      });

      if (commandeToUpdate) {
        commandeToUpdate.statut = 'annulee';
        commandeToUpdate.updated_at = new Date();
        await queryRunner.manager.save(commandeToUpdate);
      }

      // Cancel all factures
      for (const facture of factures) {
        if (facture.statut !== 'annulee') {
          facture.statut = 'annulee';
          facture.updated_at = new Date();
          await queryRunner.manager.save(facture);
        }
      }

      // Mark all bons de versement as cancelled
      for (const versement of versements) {
        if (!versement.annule) {
          versement.annule = true;
          versement.updated_at = new Date();
          await queryRunner.manager.save(versement);
        }
      }

      await queryRunner.commitTransaction();

      // Return updated commande
      return this.findOneWithDetails(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check if a commande is cancelled
   */
  async isCommandeCancelled(id: number): Promise<boolean> {
    const factures = await this.factureRepository.find({
      where: { commande_id: id },
    });

    if (factures.length === 0) {
      return false;
    }

    return factures.every(f => f.statut === 'annulee');
  }
}

