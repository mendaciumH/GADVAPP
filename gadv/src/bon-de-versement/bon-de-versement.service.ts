import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BonDeVersement } from '../entities/bon-de-versement.entity';
import { Client } from '../entities/client.entity';
import { Commande } from '../entities/commande.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { Facture, FactureStatut } from '../entities/facture.entity';
import { Caisse } from '../entities/caisse.entity';
import { NumerotationsService } from '../numerotations/numerotations.service';
import { NumerotationType } from '../entities/numerotation.entity';
import { CreateBonDeVersementDto } from './dto/create-bon-de-versement.dto';
import { UpdateBonDeVersementDto } from './dto/update-bon-de-versement.dto';
import { CaisseTransactionsService } from '../caisse-transactions/caisse-transactions.service';
import { TransactionType, ReferenceType } from '../entities/caisse-transaction.entity';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { registerFonts, drawPdfHeader, drawPdfFooter, addText } from '../common/utils/pdf.utils';
import { numberToFrenchWords } from '../common/utils/number-to-words.helper';

@Injectable()
export class BonDeVersementService {
  constructor(
    @InjectRepository(BonDeVersement)
    private bonDeVersementRepository: Repository<BonDeVersement>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
    @InjectRepository(InfoAgence)
    private infoAgenceRepository: Repository<InfoAgence>,
    @InjectRepository(Facture)
    private factureRepository: Repository<Facture>,
    @InjectRepository(Caisse)
    private caisseRepository: Repository<Caisse>,
    private numerotationsService: NumerotationsService,
    private caisseTransactionsService: CaisseTransactionsService,
    private dataSource: DataSource,
  ) { }

  async findAll(): Promise<BonDeVersement[]> {
    return this.bonDeVersementRepository.find({
      relations: ['client', 'commande', 'commande.article', 'facture'],
      order: { date_versement: 'DESC' },
    });
  }

  async findOne(id: number): Promise<BonDeVersement> {
    const bonDeVersement = await this.bonDeVersementRepository.findOne({
      where: { id },
      relations: ['client', 'commande', 'commande.article', 'facture'],
    });

    if (!bonDeVersement) {
      throw new NotFoundException(`Bon de versement with ID ${id} not found`);
    }

    return bonDeVersement;
  }

  async findByCommandeId(commandeId: number): Promise<BonDeVersement[]> {
    return this.bonDeVersementRepository.find({
      where: { commande_id: commandeId },
      relations: ['client', 'commande', 'commande.article', 'facture'],
      order: { date_versement: 'DESC' },
    });
  }

  async findByClientId(clientId: number): Promise<BonDeVersement[]> {
    return this.bonDeVersementRepository.find({
      where: { client_id: clientId },
      relations: ['client', 'commande', 'commande.article', 'facture'],
      order: { date_versement: 'DESC' },
    });
  }

  async create(createBonDeVersementDto: CreateBonDeVersementDto, userId?: number): Promise<BonDeVersement> {
    // Validate client exists
    const client = await this.clientRepository.findOne({
      where: { id: createBonDeVersementDto.client_id },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${createBonDeVersementDto.client_id} not found`);
    }

    // Validate commande exists
    const commande = await this.commandeRepository.findOne({
      where: { id: createBonDeVersementDto.commande_id },
      relations: ['article'],
    });

    if (!commande) {
      throw new NotFoundException(`Commande with ID ${createBonDeVersementDto.commande_id} not found`);
    }

    // Verify that the commande belongs to the client
    if (Number(commande.client_id) !== Number(createBonDeVersementDto.client_id)) {
      throw new BadRequestException('La commande n\'appartient pas au client spécifié');
    }

    // Find facture for this commande (to link the versement)
    const facture = await this.factureRepository.findOne({
      where: { commande_id: createBonDeVersementDto.commande_id },
    });

    // Generate numero if not provided
    const numero = createBonDeVersementDto.numero || await this.generateNumero();

    // Check if numero already exists
    const existingBon = await this.bonDeVersementRepository.findOne({
      where: { numero },
    });

    if (existingBon) {
      throw new BadRequestException(`Le numéro ${numero} existe déjà`);
    }

    const bonDeVersement = this.bonDeVersementRepository.create({
      numero,
      date_versement: createBonDeVersementDto.date_versement
        ? new Date(createBonDeVersementDto.date_versement)
        : new Date(),
      client_id: createBonDeVersementDto.client_id,
      commande_id: createBonDeVersementDto.commande_id,
      facture_id: facture?.id,
      montant_verse: createBonDeVersementDto.montant_verse,
      annule: false,
      user_id: userId,
    });

    const savedBon = await this.bonDeVersementRepository.save(bonDeVersement);

    // Update invoice status if exists
    if (facture) {
      await this.updateFactureStatus(facture.id);
    }


    // Add payment to appropriate caisse
    const articleTypeId = commande.article?.id_type_article;
    await this.addToCaisse(Number(savedBon.montant_verse), articleTypeId, userId, savedBon.id);

    return savedBon;
  }

  async update(
    id: number,
    updateBonDeVersementDto: UpdateBonDeVersementDto,
    userId?: number,
  ): Promise<BonDeVersement> {
    const bonDeVersement = await this.findOne(id);

    // Validate client if provided
    if (updateBonDeVersementDto.client_id) {
      const client = await this.clientRepository.findOne({
        where: { id: updateBonDeVersementDto.client_id },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${updateBonDeVersementDto.client_id} not found`);
      }
    }

    // Validate commande if provided
    if (updateBonDeVersementDto.commande_id) {
      const commande = await this.commandeRepository.findOne({
        where: { id: updateBonDeVersementDto.commande_id },
      });

      if (!commande) {
        throw new NotFoundException(`Commande with ID ${updateBonDeVersementDto.commande_id} not found`);
      }

      // Verify that the commande belongs to the client
      const clientId = updateBonDeVersementDto.client_id || bonDeVersement.client_id;
      if (Number(commande.client_id) !== Number(clientId)) {
        throw new BadRequestException('La commande n\'appartient pas au client spécifié');
      }
    }

    // Check numero uniqueness if provided
    if (updateBonDeVersementDto.numero && updateBonDeVersementDto.numero !== bonDeVersement.numero) {
      const existingBon = await this.bonDeVersementRepository.findOne({
        where: { numero: updateBonDeVersementDto.numero },
      });

      if (existingBon) {
        throw new BadRequestException(`Le numéro ${updateBonDeVersementDto.numero} existe déjà`);
      }
    }

    // If commande is changing, find the new facture
    let newFactureId: number | null = bonDeVersement.facture_id;
    if (updateBonDeVersementDto.commande_id && updateBonDeVersementDto.commande_id !== bonDeVersement.commande_id) {
      const newFacture = await this.factureRepository.findOne({
        where: { commande_id: updateBonDeVersementDto.commande_id },
      });
      newFactureId = newFacture?.id || null;
    }

    // Store old facture_id for status update
    const oldFactureId = bonDeVersement.facture_id;

    Object.assign(bonDeVersement, {
      ...(updateBonDeVersementDto.numero !== undefined && { numero: updateBonDeVersementDto.numero }),
      ...(updateBonDeVersementDto.date_versement !== undefined && {
        date_versement: new Date(updateBonDeVersementDto.date_versement)
      }),
      ...(updateBonDeVersementDto.client_id !== undefined && { client_id: updateBonDeVersementDto.client_id }),
      ...(updateBonDeVersementDto.commande_id !== undefined && { commande_id: updateBonDeVersementDto.commande_id }),
      ...(updateBonDeVersementDto.montant_verse !== undefined && { montant_verse: updateBonDeVersementDto.montant_verse }),
      ...(newFactureId !== bonDeVersement.facture_id && { facture_id: newFactureId }),
      updated_at: new Date(),
      user_id: userId,
    });

    const savedBon = await this.bonDeVersementRepository.save(bonDeVersement);

    // Update facture status for old and new factures
    if (oldFactureId) {
      await this.updateFactureStatus(oldFactureId);
    }
    if (newFactureId && newFactureId !== oldFactureId) {
      await this.updateFactureStatus(newFactureId);
    }

    return savedBon;
  }

  async remove(id: number): Promise<void> {
    const bonDeVersement = await this.findOne(id);
    const factureId = bonDeVersement.facture_id;

    await this.bonDeVersementRepository.remove(bonDeVersement);

    // Update facture status after removing versement
    if (factureId) {
      await this.updateFactureStatus(factureId);
    }
  }

  // ============================================
  // HELPER METHODS FOR FACTURE STATUS UPDATE
  // ============================================

  /**
   * Calculate total paid for a facture from all non-cancelled versements
   * Considers versements linked by facture_id OR by commande_id (for backward compatibility)
   */
  private async getTotalPaidForFacture(factureId: number): Promise<number> {
    const facture = await this.factureRepository.findOne({
      where: { id: factureId },
    });

    if (!facture) {
      return 0;
    }

    // Get versements linked directly to facture OR linked via commande
    const result = await this.bonDeVersementRepository
      .createQueryBuilder('bv')
      .select('COALESCE(SUM(bv.montant_verse), 0)', 'total')
      .where('(bv.facture_id = :factureId OR (bv.facture_id IS NULL AND bv.commande_id = :commandeId))', {
        factureId,
        commandeId: facture.commande_id
      })
      .andWhere('bv.annule = :annule', { annule: false })
      .getRawOne();

    return Number(result?.total) || 0;
  }

  /**
   * Update facture status based on payments
   */
  private async updateFactureStatus(factureId: number): Promise<void> {
    const facture = await this.factureRepository.findOne({
      where: { id: factureId },
    });

    if (!facture || facture.statut === 'annulee') {
      return;
    }

    const totalPaid = await this.getTotalPaidForFacture(factureId);
    const montantTTC = Number(facture.montant_ttc) || 0;
    const montantRestant = Math.max(0, montantTTC - totalPaid);

    const today = new Date();
    const dateEcheance = facture.date_echeance ? new Date(facture.date_echeance) : null;

    let newStatut: FactureStatut;

    if (montantRestant <= 0) {
      newStatut = 'payee';
    } else if (dateEcheance && dateEcheance < today) {
      newStatut = 'impayee';
    } else {
      newStatut = 'en_attente';
    }

    if (facture.statut !== newStatut) {
      facture.statut = newStatut;
      facture.updated_at = new Date();
      await this.factureRepository.save(facture);
    }
  }

  /**
   * Add payment amount to appropriate caisse
   */
  private async addToCaisse(montant: number, typeArticleId?: number, userId?: number, referenceId?: number): Promise<void> {
    try {
      // Determine which caisse to use based on Article Type
      const caisse = await this.caisseTransactionsService.findCaisseForArticleType(typeArticleId);

      if (!caisse) {
        console.warn('No suitable Caisse found. Payment not added to caisse.');
        return;
      }

      await this.caisseTransactionsService.createTransaction(
        caisse.id,
        userId || null,
        TransactionType.ENCAISSEMENT,
        montant,
        ReferenceType.BON_VERSEMENT,
        referenceId || 0,
        `Versement #${referenceId} (Article Type: ${typeArticleId})`
      );

      console.log(`💰 Added ${montant} DZD to ${caisse.nom_caisse}.`);
    } catch (error) {
      console.error('Error adding to caisse:', error);
      // Don't throw - payment should still be recorded even if caisse update fails
    }
  }

  /**
   * Remove payment amount from caisse principale (for cancelled payments)
   */
  private async removeFromCaissePrincipale(montant: number, referenceId?: number): Promise<void> {
    try {
      // Find caisse principale
      const caisse = await this.caisseRepository.findOne({
        where: { is_principale: true },
      });

      if (!caisse) {
        console.warn('Caisse principale not found. Payment not removed from caisse.');
        return;
      }

      await this.caisseTransactionsService.createTransaction(
        caisse.id,
        null, // System action or need user ID passed down? Assuming system for now as this method is private/internal
        TransactionType.DECAISSEMENT,
        montant,
        ReferenceType.BON_VERSEMENT,
        referenceId || 0,
        `Annulation Versement #${referenceId} (Removed from Caisse Principale)`
      );

      console.log(`💸 Removed ${montant} DZD from Caisse principale.`);
    } catch (error) {
      console.error('Error removing from caisse principale:', error);
    }
  }

  async generatePdf(bonDeVersementId: number, res: Response): Promise<void> {
    // Fetch bon de versement with relations
    const bonDeVersement = await this.bonDeVersementRepository.findOne({
      where: { id: bonDeVersementId },
      relations: ['client', 'commande', 'commande.client', 'commande.article'],
    });

    if (!bonDeVersement) {
      throw new NotFoundException(`Bon de versement with ID ${bonDeVersementId} not found`);
    }

    // Fetch agency info
    const infoAgence = await this.infoAgenceRepository.findOne({
      where: { id: 1 },
    });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Register fonts
    const hasArabicFont = registerFonts(doc);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bon-de-versement-${bonDeVersement.numero}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Default colors
    doc.fillColor('black');
    doc.strokeColor('black');

    // Draw Header
    let yPos = drawPdfHeader(doc, infoAgence);

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // Title
    addText(doc, 'BON DE VERSEMENT', 20, true, hasArabicFont, { align: 'center', y: yPos });
    yPos += 40;

    // Bon de versement details
    const client = bonDeVersement.commande?.client || bonDeVersement.client;
    const clientName = client?.type_client === 'Entreprise'
      ? client.nom_entreprise
      : client?.nom_complet || 'N/A';

    // Table-like layout
    const lineHeight = 20;
    const labelWidth = 150;
    const valueWidth = contentWidth - labelWidth;

    // Numéro
    addText(doc, 'Numéro:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
    addText(doc, bonDeVersement.numero, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
    yPos += lineHeight;

    // Date de versement
    const dateVersement = bonDeVersement.date_versement
      ? new Date(bonDeVersement.date_versement).toLocaleDateString('fr-FR')
      : 'N/A';
    addText(doc, 'Date de versement:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
    addText(doc, dateVersement, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
    yPos += lineHeight * 1.5;

    // Client information
    addText(doc, 'INFORMATIONS CLIENT', 14, true, hasArabicFont, { x: margin, y: yPos });
    yPos += lineHeight;

    addText(doc, 'Nom:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
    addText(doc, clientName, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
    yPos += lineHeight;

    if (client?.type_client === 'Entreprise') {
      if (client.rc) {
        addText(doc, 'RC:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
        addText(doc, client.rc, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
        yPos += lineHeight;
      }
      if (client.nif) {
        addText(doc, 'NIF:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
        addText(doc, client.nif, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
        yPos += lineHeight;
      }
    }

    if (client?.numero_mobile) {
      addText(doc, 'Téléphone:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
      addText(doc, client.numero_mobile, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
      yPos += lineHeight;
    }

    yPos += lineHeight * 0.5;

    // Commande information
    if (bonDeVersement.commande) {
      addText(doc, 'INFORMATIONS COMMANDE', 14, true, hasArabicFont, { x: margin, y: yPos });
      yPos += lineHeight;

      addText(doc, 'Commande N°:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
      addText(doc, `#${bonDeVersement.commande.id}`, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
      yPos += lineHeight;

      if (bonDeVersement.commande.article?.label) {
        addText(doc, 'Article:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
        addText(doc, bonDeVersement.commande.article.label, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
        yPos += lineHeight;
      }

      if (bonDeVersement.commande.prix) {
        addText(doc, 'Prix commande:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
        addText(doc, `${Number(bonDeVersement.commande.prix).toFixed(2)} DA`, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
        yPos += lineHeight;
      }
    }

    yPos += lineHeight * 1.5;

    // Montant versé (highlighted)
    doc.rect(margin, yPos, contentWidth, lineHeight * 2).stroke();
    addText(doc, 'MONTANT VERSÉ', 14, true, hasArabicFont, { x: margin + 10, y: yPos + 10, width: contentWidth - 20, align: 'center' });
    yPos += lineHeight;
    const montantVerse = Number(bonDeVersement.montant_verse);
    addText(doc, `${montantVerse.toFixed(2)} DA`, 18, true, hasArabicFont, { x: margin + 10, y: yPos + 5, width: contentWidth - 20, align: 'center' });
    yPos += lineHeight * 2.5;

    // Amount in words
    doc.fillColor('black').font('Helvetica').fontSize(9);
    doc.text(`Arrêté le présent bon à la somme de: ${numberToFrenchWords(montantVerse)}`, margin, yPos);

    // Footer
    drawPdfFooter(doc, infoAgence);

    // Finalize PDF
    doc.end();
  }

  private async generateNumero(): Promise<string> {
    return this.numerotationsService.getNextNumber(NumerotationType.BON_VERSEMENT);
  }
}

