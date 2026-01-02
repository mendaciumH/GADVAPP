import { DataSource, Repository } from 'typeorm';
import { ArticleOmra } from '../../entities/article-omra.entity';
import { ArticleVisa } from '../../entities/article-visa.entity';
import { ArticleVoyage } from '../../entities/article-voyage.entity';
import { ArticleAssurance } from '../../entities/article-assurance.entity';
import { ArticleBilletAvion } from '../../entities/article-billet-avion.entity';
import { ArticleReservationHotel } from '../../entities/article-reservation-hotel.entity';
import { Chambre } from '../../entities/chambre.entity';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

export class ArticleSpecificHelper {
  constructor(private dataSource: DataSource) { }

  // Get chambre repository
  private getChambreRepository(): Repository<Chambre> {
    return this.dataSource.getRepository(Chambre);
  }

  // Save chambres for article (used by Omra, Voyage organisé, Réservation hôtel)
  async saveChambres(articleId: number, chambres: { type_chambre: string; prix: number }[], userId?: number): Promise<void> {
    const chambreRepo = this.getChambreRepository();

    // Delete existing chambres for this article using query builder
    await chambreRepo
      .createQueryBuilder()
      .delete()
      .from(Chambre)
      .where('article_id = :articleId', { articleId })
      .execute();

    // Insert new chambres
    if (chambres && chambres.length > 0) {
      const chambresToSave = chambres.map(c => ({
        article_id: articleId,
        type_chambre: c.type_chambre,
        prix: c.prix || 0,
        user_id: userId,
      }));
      await chambreRepo.save(chambresToSave);
    }
  }

  // Load chambres for article
  async loadChambres(articleId: number): Promise<Chambre[]> {
    const chambreRepo = this.getChambreRepository();
    return chambreRepo
      .createQueryBuilder('chambre')
      .where('chambre.article_id = :articleId', { articleId })
      .getMany();
  }

  // Delete chambres for article
  async deleteChambres(articleId: number): Promise<void> {
    const chambreRepo = this.getChambreRepository();
    await chambreRepo
      .createQueryBuilder()
      .delete()
      .from(Chambre)
      .where('article_id = :articleId', { articleId })
      .execute();
  }

  // Get repository for specific article type
  private getRepository(typeId: number): Repository<any> | null {
    // Convert typeId to number in case it's a string (bigint from PostgreSQL)
    const normalizedTypeId = typeof typeId === 'string' ? parseInt(typeId as unknown as string, 10) : typeId;

    switch (normalizedTypeId) {
      case 1: // Omra
        return this.dataSource.getRepository(ArticleOmra);
      case 4: // Demande Visa
        return this.dataSource.getRepository(ArticleVisa);
      case 2: // Voyage organisé
        return this.dataSource.getRepository(ArticleVoyage);
      case 5: // Assurance voyage
        return this.dataSource.getRepository(ArticleAssurance);
      case 3: // Billet d'avion
        return this.dataSource.getRepository(ArticleBilletAvion);
      case 6: // Réservation hôtels
        return this.dataSource.getRepository(ArticleReservationHotel);
      default:
        return null;
    }
  }

  // Save specific data for an article
  async saveSpecificData(articleId: number, typeId: number, dto: CreateArticleDto | UpdateArticleDto, userId?: number): Promise<void> {
    // Convert typeId to number in case it's a string (bigint from PostgreSQL)
    const normalizedTypeId = typeof typeId === 'string' ? parseInt(typeId, 10) : typeId;

    const repository = this.getRepository(normalizedTypeId);
    if (!repository) return;

    switch (normalizedTypeId) {
      case 1: // Omra
        await this.saveOmraData(repository as Repository<ArticleOmra>, articleId, dto, userId);
        break;
      case 4: // Visa
        await this.saveVisaData(repository as Repository<ArticleVisa>, articleId, dto);
        break;
      case 2: // Voyage
        await this.saveVoyageData(repository as Repository<ArticleVoyage>, articleId, dto);
        break;
      case 5: // Assurance
        await this.saveAssuranceData(repository as Repository<ArticleAssurance>, articleId, dto);
        break;
      case 3: // Billet avion
        await this.saveBilletAvionData(repository as Repository<ArticleBilletAvion>, articleId, dto);
        break;
      case 6: // Réservation hôtel
        await this.saveReservationHotelData(repository as Repository<ArticleReservationHotel>, articleId, dto);
        break;
    }
  }

  // Load specific data for an article
  async loadSpecificData(articleId: number, typeId: number): Promise<any> {
    // Convert typeId to number in case it's a string (bigint from PostgreSQL)
    const normalizedTypeId = typeof typeId === 'string' ? parseInt(typeId, 10) : typeId;
    // Convert articleId to number in case it's a string (bigint from PostgreSQL)
    const normalizedArticleId = typeof articleId === 'string' ? parseInt(articleId, 10) : articleId;

    const repository = this.getRepository(normalizedTypeId);
    if (!repository) return null;

    // Use query builder for proper bigint handling
    const specificData = await repository
      .createQueryBuilder('specific')
      .where('specific.article_id = :articleId', { articleId: normalizedArticleId })
      .getOne();

    // Load chambres for types that use them (Omra=1, Voyage organisé=2, Réservation hôtel=6)
    if ([1, 2, 6].includes(normalizedTypeId)) {
      const chambres = await this.loadChambres(normalizedArticleId);
      // Handle case where specificData might be null
      const baseData = specificData || {};
      return {
        ...baseData,
        // Convert prix to number (PostgreSQL decimal returns as string)
        chambres: chambres.map(c => ({
          id: c.id,
          type_chambre: c.type_chambre,
          prix: typeof c.prix === 'string' ? parseFloat(c.prix) : (c.prix || 0)
        })),
      };
    }

    return specificData;
  }

  // Delete specific data for an article
  async deleteSpecificData(articleId: number, typeId: number): Promise<void> {
    // Convert typeId to number in case it's a string (bigint from PostgreSQL)
    const normalizedTypeId = typeof typeId === 'string' ? parseInt(typeId, 10) : typeId;
    // Convert articleId to number in case it's a string (bigint from PostgreSQL)
    const normalizedArticleId = typeof articleId === 'string' ? parseInt(articleId as unknown as string, 10) : articleId;

    const repository = this.getRepository(normalizedTypeId);
    if (!repository) return;

    // Delete chambres first for types that use them
    if ([1, 2, 6].includes(normalizedTypeId)) {
      await this.deleteChambres(normalizedArticleId);
    }

    // Use query builder for proper bigint handling
    await repository
      .createQueryBuilder()
      .delete()
      .where('article_id = :articleId', { articleId: normalizedArticleId })
      .execute();
  }

  // Helper methods for each type
  private async saveOmraData(repo: Repository<ArticleOmra>, articleId: number, dto: CreateArticleDto | UpdateArticleDto, userId?: number): Promise<void> {
    // Use query builder for proper bigint handling
    const existing = await repo
      .createQueryBuilder('omra')
      .where('omra.article_id = :articleId', { articleId })
      .getOne();

    const data: Partial<ArticleOmra> = {
      article_id: articleId,
      nom_hotel: dto.nom_hotel?.trim() || undefined,
      distance_hotel: dto.distance_hotel ?? undefined,
      entree: dto.entree?.trim() || undefined,
      sortie: dto.sortie?.trim() || undefined,
      tarif_additionnel: dto.tarif_additionnel ?? undefined,
    };

    if (existing) {
      await repo
        .createQueryBuilder()
        .update(ArticleOmra)
        .set({
          nom_hotel: data.nom_hotel,
          distance_hotel: data.distance_hotel,
          entree: data.entree,
          sortie: data.sortie,
          tarif_additionnel: data.tarif_additionnel,
        })
        .where('article_id = :articleId', { articleId })
        .execute();
    } else {
      await repo.save(data);
    }

    // Save chambres to separate table
    if (dto.chambres) {
      await this.saveChambres(articleId, dto.chambres, userId);
    }
  }

  private async saveVisaData(repo: Repository<ArticleVisa>, articleId: number, dto: CreateArticleDto | UpdateArticleDto): Promise<void> {
    const existing = await repo.findOne({ where: { article_id: articleId } });
    const data: Partial<ArticleVisa> = {
      article_id: articleId,
      pays_destination: dto.pays_destination?.trim() || undefined,
      type_visa: dto.type_visa?.trim() || undefined,
      duree_validite: dto.duree_validite?.trim() || undefined,
      delai_traitement: dto.delai_traitement?.trim() || undefined,
      documents_requis: dto.documents_requis || undefined,
    };

    if (existing) {
      await repo.update({ article_id: articleId }, data);
    } else {
      await repo.save(data);
    }
  }

  private async saveVoyageData(repo: Repository<ArticleVoyage>, articleId: number, dto: CreateArticleDto | UpdateArticleDto): Promise<void> {
    const existing = await repo.findOne({ where: { article_id: articleId } });
    const data: Partial<ArticleVoyage> = {
      article_id: articleId,
      destination: dto.destination?.trim() || undefined,
      date_retour: dto.date_retour ? new Date(dto.date_retour) : undefined,
      duree_voyage: dto.duree_voyage?.trim() || undefined,
      type_hebergement: dto.type_hebergement?.trim() || undefined,
      transport: dto.transport?.trim() || undefined,
      programme: dto.programme || undefined,
    };

    if (existing) {
      await repo.update({ article_id: articleId }, data);
    } else {
      await repo.save(data);
    }
  }

  private async saveAssuranceData(repo: Repository<ArticleAssurance>, articleId: number, dto: CreateArticleDto | UpdateArticleDto): Promise<void> {
    const existing = await repo.findOne({ where: { article_id: articleId } });
    const data: Partial<ArticleAssurance> = {
      article_id: articleId,
      type_assurance: dto.type_assurance?.trim() || undefined,
      duree_couverture: dto.duree_couverture?.trim() || undefined,
      zone_couverture: dto.zone_couverture?.trim() || undefined,
      montant_couverture: dto.montant_couverture?.trim() || undefined,
      franchise: dto.franchise?.trim() || undefined,
      conditions_particulieres: dto.conditions_particulieres || undefined,
    };

    if (existing) {
      await repo.update({ article_id: articleId }, data);
    } else {
      await repo.save(data);
    }
  }

  private async saveBilletAvionData(repo: Repository<ArticleBilletAvion>, articleId: number, dto: CreateArticleDto | UpdateArticleDto): Promise<void> {
    const existing = await repo.findOne({ where: { article_id: articleId } });
    const data: Partial<ArticleBilletAvion> = {
      article_id: articleId,
      aeroport_depart: dto.aeroport_depart?.trim() || undefined,
      aeroport_arrivee: dto.aeroport_arrivee?.trim() || undefined,
      date_depart_vol: dto.date_depart_vol ? new Date(dto.date_depart_vol) : undefined,
      date_retour_vol: dto.date_retour_vol ? new Date(dto.date_retour_vol) : undefined,
      compagnie_aerienne_id: dto.compagnie_aerienne_id ?? undefined,
      numero_vol: dto.numero_vol?.trim() || undefined,
      classe_vol: dto.classe_vol?.trim() || undefined,
      escales: dto.escales || undefined,
    };

    if (existing) {
      await repo.update({ article_id: articleId }, data);
    } else {
      await repo.save(data);
    }
  }

  private async saveReservationHotelData(repo: Repository<ArticleReservationHotel>, articleId: number, dto: CreateArticleDto | UpdateArticleDto): Promise<void> {
    const existing = await repo.findOne({ where: { article_id: articleId } });
    const data: Partial<ArticleReservationHotel> = {
      article_id: articleId,
      date_check_in: dto.date_check_in ? new Date(dto.date_check_in) : undefined,
      date_check_out: dto.date_check_out ? new Date(dto.date_check_out) : undefined,
      nombre_nuits: dto.nombre_nuits ?? undefined,
      nombre_chambres: dto.nombre_chambres ?? undefined,
      nombre_personnes: dto.nombre_personnes ?? undefined,
      type_chambre: dto.type_chambre?.trim() || undefined,
      services_hotel: dto.services_hotel || undefined,
      adresse_hotel: dto.adresse_hotel?.trim() || undefined,
      ville_hotel: dto.ville_hotel?.trim() || undefined,
      pays_hotel: dto.pays_hotel?.trim() || undefined,
    };

    if (existing) {
      await repo.update({ article_id: articleId }, data);
    } else {
      await repo.save(data);
    }
  }
}

