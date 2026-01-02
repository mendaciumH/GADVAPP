import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Facture, FactureStatut } from '../entities/facture.entity';
import { Commande } from '../entities/commande.entity';
import { BonDeVersement } from '../entities/bon-de-versement.entity';
import { BonDeRemboursement } from '../entities/bon-de-remboursement.entity';
import { Client } from '../entities/client.entity';
import { Caisse } from '../entities/caisse.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { PayFactureDto } from './dto/pay-facture.dto';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { registerFonts, drawPdfHeader, drawPdfFooter, addText } from '../common/utils/pdf.utils';
import { NumerotationsService } from '../numerotations/numerotations.service';
import { NumerotationType } from '../entities/numerotation.entity';
import { CaisseTransactionsService } from '../caisse-transactions/caisse-transactions.service';
import { TransactionType, ReferenceType } from '../entities/caisse-transaction.entity';
import { numberToFrenchWords } from '../common/utils/number-to-words.helper';

export interface PaymentResult {
  facture: Facture;
  bonDeVersement: BonDeVersement;
  montantPaye: number;
  montantRestant: number;
}

export interface FactureWithPaymentInfo extends Facture {
  montant_paye?: number;
  montant_restant?: number;
}

@Injectable()
export class FacturesService {
  constructor(
    @InjectRepository(Facture)
    private factureRepository: Repository<Facture>,
    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
    @InjectRepository(BonDeVersement)
    private bonDeVersementRepository: Repository<BonDeVersement>,
    @InjectRepository(BonDeRemboursement)
    private bonDeRemboursementRepository: Repository<BonDeRemboursement>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Caisse)
    private caisseRepository: Repository<Caisse>,
    @InjectRepository(InfoAgence)
    private infoAgenceRepository: Repository<InfoAgence>,
    private numerotationsService: NumerotationsService,
    private caisseTransactionsService: CaisseTransactionsService,
    private dataSource: DataSource,
  ) { }

  async findAll(): Promise<FactureWithPaymentInfo[]> {
    const factures = await this.factureRepository
      .createQueryBuilder('facture')
      .leftJoinAndSelect('facture.commande', 'commande')
      .leftJoinAndSelect('commande.client', 'client')
      .leftJoinAndSelect('commande.article', 'article')
      .leftJoinAndSelect('facture.user', 'user')
      .orderBy('facture.date_facture', 'DESC')
      .getMany();

    // Add payment info to each facture
    return Promise.all(
      factures.map(async (facture) => {
        const montantPaye = await this.getTotalPaid(facture.id);
        const montantTTC = Number(facture.montant_ttc) || 0;
        return {
          ...facture,
          montant_paye: montantPaye,
          montant_restant: Math.max(0, montantTTC - montantPaye),
        };
      }),
    );
  }

  async findOne(id: number): Promise<Facture> {
    const facture = await this.factureRepository.findOne({
      where: { id },
      relations: ['commande', 'commande.client', 'commande.article', 'user'],
    });

    if (!facture) {
      throw new NotFoundException(`Facture with ID ${id} not found`);
    }

    return facture;
  }

  async findByCommandeId(commandeId: number): Promise<Facture[]> {
    return this.factureRepository.find({
      where: { commande_id: commandeId },
      relations: ['commande', 'commande.client', 'commande.article', 'user'],
      order: { date_facture: 'DESC' },
    });
  }

  async generateFromCommande(commandeId: number, notes?: string, user?: any): Promise<Facture> {
    // Find the commande
    const commande = await this.commandeRepository.findOne({
      where: { id: commandeId },
      relations: ['client', 'article'],
    });

    if (!commande) {
      throw new NotFoundException(`Commande with ID ${commandeId} not found`);
    }

    // Check if invoice already exists for this commande
    const existingFacture = await this.factureRepository.findOne({
      where: { commande_id: commandeId },
    });

    if (existingFacture) {
      throw new BadRequestException(`Une facture existe déjà pour la commande #${commandeId}`);
    }

    // Generate invoice number (format: FACT-YYYYMMDD-XXXX)
    const numeroFacture = await this.generateInvoiceNumber();

    // Calculate amounts
    const prix = commande.prix || 0;
    const reductions = commande.reductions || 0;
    const autreReductions = commande.autre_reductions || 0;
    const taxes = commande.taxes || 0;

    // Calculate HT (before tax)
    const montantHT = prix - reductions - autreReductions;

    // Calculate TVA (tax amount)
    const montantTVA = taxes;

    // Calculate TTC (total with tax)
    const montantTTC = montantHT + montantTVA;

    // Calculate due date (30 days from invoice date by default)
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);

    const facture = this.factureRepository.create({
      commande_id: commandeId,
      numero_facture: numeroFacture,
      date_facture: new Date(),
      date_echeance: dateEcheance,
      montant_ht: montantHT,
      montant_tva: montantTVA,
      montant_ttc: montantTTC,
      reductions: reductions,
      autre_reductions: autreReductions,
      taxes: taxes,
      statut: 'en_attente' as FactureStatut,
      notes: notes || null,
      user_id: user?.id || null,
    } as Facture);

    return this.factureRepository.save(facture);
  }

  async create(factureData: {
    commande_id: number;
    numero_facture?: string;
    date_facture?: string;
    date_echeance?: string;
    montant_ht?: number;
    montant_tva?: number;
    montant_ttc?: number;
    reductions?: number;
    autre_reductions?: number;
    taxes?: number;
    statut?: FactureStatut;
    notes?: string;
  }, user?: any): Promise<Facture> {
    if (!factureData.commande_id) {
      throw new BadRequestException('commande_id is required');
    }

    // Check if commande exists
    const commande = await this.commandeRepository.findOne({
      where: { id: factureData.commande_id },
    });

    if (!commande) {
      throw new NotFoundException(`Commande with ID ${factureData.commande_id} not found`);
    }

    // Generate invoice number if not provided
    const numeroFacture = factureData.numero_facture || await this.generateInvoiceNumber();

    // Check if invoice number already exists
    const existingFacture = await this.factureRepository.findOne({
      where: { numero_facture: numeroFacture },
    });

    if (existingFacture) {
      throw new BadRequestException(`Le numéro de facture ${numeroFacture} existe déjà`);
    }

    const dateFacture = factureData.date_facture ? new Date(factureData.date_facture) : new Date();
    const dateEcheance = factureData.date_echeance ? new Date(factureData.date_echeance) : null;

    const facture = this.factureRepository.create({
      commande_id: factureData.commande_id,
      numero_facture: numeroFacture,
      date_facture: dateFacture,
      date_echeance: dateEcheance,
      montant_ht: factureData.montant_ht || 0,
      montant_tva: factureData.montant_tva || 0,
      montant_ttc: factureData.montant_ttc || 0,
      reductions: factureData.reductions || 0,
      autre_reductions: factureData.autre_reductions || 0,
      taxes: factureData.taxes || 0,
      statut: factureData.statut || 'en_attente',
      notes: factureData.notes?.trim() || null,
      user_id: user?.id || null,
    } as Facture);

    return this.factureRepository.save(facture);
  }

  async update(
    id: number,
    factureData: {
      numero_facture?: string;
      date_facture?: string;
      date_echeance?: string;
      montant_ht?: number;
      montant_tva?: number;
      montant_ttc?: number;
      reductions?: number;
      autre_reductions?: number;
      taxes?: number;
      statut?: FactureStatut;
      notes?: string;
    },
    user?: any,
  ): Promise<Facture> {
    const facture = await this.findOne(id);

    if (factureData.numero_facture && factureData.numero_facture !== facture.numero_facture) {
      // Check if new invoice number already exists
      const existingFacture = await this.factureRepository.findOne({
        where: { numero_facture: factureData.numero_facture },
      });

      if (existingFacture) {
        throw new BadRequestException(`Le numéro de facture ${factureData.numero_facture} existe déjà`);
      }
    }

    Object.assign(facture, {
      ...(factureData.numero_facture !== undefined && { numero_facture: factureData.numero_facture }),
      ...(factureData.date_facture !== undefined && { date_facture: new Date(factureData.date_facture) }),
      ...(factureData.date_echeance !== undefined && { date_echeance: factureData.date_echeance ? new Date(factureData.date_echeance) : null }),
      ...(factureData.montant_ht !== undefined && { montant_ht: factureData.montant_ht }),
      ...(factureData.montant_tva !== undefined && { montant_tva: factureData.montant_tva }),
      ...(factureData.montant_ttc !== undefined && { montant_ttc: factureData.montant_ttc }),
      ...(factureData.reductions !== undefined && { reductions: factureData.reductions }),
      ...(factureData.autre_reductions !== undefined && { autre_reductions: factureData.autre_reductions }),
      ...(factureData.taxes !== undefined && { taxes: factureData.taxes }),
      ...(factureData.statut !== undefined && { statut: factureData.statut }),
      ...(factureData.notes !== undefined && { notes: factureData.notes?.trim() || null }),
      ...(user?.id && { user_id: user.id }),
      updated_at: new Date(),
    });

    return this.factureRepository.save(facture);
  }

  async remove(id: number): Promise<void> {
    const facture = await this.findOne(id);
    await this.factureRepository.remove(facture);
  }

  // ============================================
  // PAYMENT METHODS
  // ============================================

  /**
   * Get total amount paid for a facture
   * Considers versements linked by facture_id OR by commande_id (legacy/advances)
   * AND CaisseTransactions linked directly to the facture (new payment method)
   * SUBTRACTS BonDeRemboursement linked to the commande
   */
  async getTotalPaid(factureId: number): Promise<number> {
    const facture = await this.factureRepository.findOne({
      where: { id: factureId },
    });

    if (!facture) {
      return 0;
    }

    // 1. Sum legacy BonDeVersement (linked to facture OR commande)
    const resultBDV = await this.bonDeVersementRepository
      .createQueryBuilder('bv')
      .select('COALESCE(SUM(bv.montant_verse), 0)', 'total')
      .where('(bv.facture_id = :factureId OR (bv.facture_id IS NULL AND bv.commande_id = :commandeId))', {
        factureId,
        commandeId: facture.commande_id
      })
      .andWhere('bv.annule = :annule', { annule: false })
      .getRawOne();

    const totalBDV = Number(resultBDV?.total) || 0;

    // 2. Sum CaisseTransactions linked to this Facture (ReferenceType.FACTURE)
    const resultCT = await this.dataSource.getRepository('caisse_transactions')
      .createQueryBuilder('ct')
      .select('COALESCE(SUM(ct.montant), 0)', 'total')
      .where('ct.reference_type = :refType', { refType: ReferenceType.FACTURE })
      .andWhere('ct.reference_id = :refId', { refId: factureId })
      // Assuming 'encaissement' adds to paid, 'decaissement' subtracts? Usually payments are encaissements.
      // Or maybe decaissement on a facture is a refund? Let's assume only ENCAISSEMENT counts as paid for now.
      .andWhere('ct.type = :type', { type: TransactionType.ENCAISSEMENT })
      .getRawOne();

    const totalCT = Number(resultCT?.total) || 0;

    // 3. Subtract BonDeRemboursement (linked to Commande)
    const resultRemboursement = await this.bonDeRemboursementRepository
      .createQueryBuilder('br')
      .select('COALESCE(SUM(br.montant), 0)', 'total')
      .where('br.commande_id = :commandeId', { commandeId: facture.commande_id })
      .getRawOne();

    const totalRemboursement = Number(resultRemboursement?.total) || 0;

    const totalPaid = (totalBDV + totalCT) - totalRemboursement;

    // Ensure we don't return negative paid amount (though technically possible if refund > payment)
    return totalPaid;
  }

  /**
   * Get remaining amount to pay for a facture
   */
  async getRemainingAmount(factureId: number): Promise<number> {
    const facture = await this.findOne(factureId);
    const totalPaid = await this.getTotalPaid(factureId);
    const montantTTC = Number(facture.montant_ttc) || 0;
    return Math.max(0, montantTTC - totalPaid);
  }

  /**
   * Get payment info for a facture
   */
  async getPaymentInfo(factureId: number): Promise<{
    montantPaye: number;
    montantRestant: number;
    versements: BonDeVersement[];
    transactions: any[];
    remboursements: BonDeRemboursement[];
  }> {
    const facture = await this.findOne(factureId);
    const montantPaye = await this.getTotalPaid(factureId);
    const montantTTC = Number(facture.montant_ttc) || 0;

    // Get legacy versements
    const versements = await this.bonDeVersementRepository
      .createQueryBuilder('bv')
      .leftJoinAndSelect('bv.client', 'client')
      .where('(bv.facture_id = :factureId OR (bv.facture_id IS NULL AND bv.commande_id = :commandeId))', {
        factureId,
        commandeId: facture.commande_id
      })
      .andWhere('bv.annule = :annule', { annule: false })
      .orderBy('bv.date_versement', 'DESC')
      .getMany();

    // Get new transactions
    const transactions = await this.dataSource.getRepository('caisse_transactions').find({
      where: {
        reference_type: ReferenceType.FACTURE,
        reference_id: factureId,
        type: TransactionType.ENCAISSEMENT
      },
      order: { date_transaction: 'DESC' },
      relations: ['user', 'caisse']
    });

    // Get remboursements
    const remboursements = await this.bonDeRemboursementRepository.find({
      where: { commande_id: facture.commande_id },
      order: { date_remboursement: 'DESC' },
      relations: ['client']
    });

    return {
      montantPaye,
      montantRestant: Math.max(0, montantTTC - montantPaye),
      versements,
      transactions,
      remboursements
    };
  }

  /**
   * Update facture status based on payments
   */
  async updateFactureStatus(factureId: number): Promise<Facture> {
    const facture = await this.findOne(factureId);

    // Don't update if already cancelled
    if (facture.statut === 'annulee') {
      return facture;
    }

    const montantRestant = await this.getRemainingAmount(factureId);
    const today = new Date();
    const dateEcheance = facture.date_echeance ? new Date(facture.date_echeance) : null;

    let newStatut: FactureStatut;

    if (montantRestant <= 0.01) { // Floating point tolerance
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

    return facture;
  }

  /**
   * Pay a facture (partial or full payment)
   * RECORDS PAYMENT IN CAISSE_TRANSACTIONS (Reference: FACTURE)
   */
  async payFacture(factureId: number, paymentDto: PayFactureDto, userId?: number): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Lock the facture row explicitly
      const lockedFacture = await queryRunner.manager.findOne(Facture, {
        where: { id: factureId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedFacture) {
        throw new NotFoundException(`Facture with ID ${factureId} not found`);
      }

      // 2. Fetch dependencies
      const facture = await queryRunner.manager.findOne(Facture, {
        where: { id: factureId },
        relations: ['commande', 'commande.client', 'commande.article'],
      });
      if (!facture) throw new NotFoundException('Facture not found'); // Should not happen

      if (facture.statut === 'annulee') {
        throw new BadRequestException('Impossible de payer une facture annulée');
      }
      if (facture.statut === 'payee') {
        throw new BadRequestException('Cette facture est déjà entièrement payée');
      }

      // 3. Calculate amounts
      const montantRestant = await this.getRemainingAmount(factureId);
      const montantAPayer = Number(paymentDto.montant);

      if (montantAPayer <= 0) {
        throw new BadRequestException('Le montant doit être supérieur à 0');
      }
      if (montantAPayer > montantRestant) {
        throw new BadRequestException(
          `Le montant (${montantAPayer} DA) dépasse le montant restant (${montantRestant.toFixed(2)} DA)`,
        );
      }

      // 4. Determine Caisse
      const articleTypeId = facture.commande?.article?.id_type_article;
      // We must find the caisse *outside* the transaction or reusing the queryRunner
      // The current service method doesn't accept queryRunner, but reading is fine.
      const caisse = await this.caisseTransactionsService.findCaisseForArticleType(articleTypeId);

      if (!caisse) {
        throw new BadRequestException('Aucune caisse appropriée trouvée pour ce paiement.');
      }

      // 5. Create Caisse Transaction (The Payment Record)
      const transaction = await this.caisseTransactionsService.createTransaction(
        caisse.id,
        userId || null,
        TransactionType.ENCAISSEMENT,
        montantAPayer,
        ReferenceType.FACTURE,
        factureId,
        `Paiement Facture #${facture.numero_facture} (${paymentDto.mode_reglement || 'Espèce'})`,
        queryRunner // Pass the transaction runner!
      );

      // 6. Update Facture Status
      const nouveauMontantRestant = montantRestant - montantAPayer;
      let newStatut: FactureStatut = facture.statut;

      if (nouveauMontantRestant <= 0.01) {
        newStatut = 'payee';
      } else {
        const dateEcheance = facture.date_echeance ? new Date(facture.date_echeance) : null;
        if (dateEcheance && dateEcheance < new Date()) {
          newStatut = 'impayee';
        } else {
          newStatut = 'en_attente';
        }
      }

      if (facture.statut !== newStatut) {
        facture.statut = newStatut;
        facture.updated_at = new Date();
        await queryRunner.manager.save(facture);
      }

      await queryRunner.commitTransaction();

      // 7. Return Result
      const finalFacture = await this.findOne(factureId);
      const totalPaid = await this.getTotalPaid(factureId);

      return {
        facture: finalFacture,
        transaction,
        montantPaye: totalPaid,
        montantRestant: nouveauMontantRestant,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel all payments for a facture
   */
  async cancelFacturePayments(factureId: number): Promise<void> {
    await this.bonDeVersementRepository.update(
      { facture_id: factureId },
      { annule: true, updated_at: new Date() },
    );
  }

  /**
   * Cancel a facture
   */
  async cancelFacture(factureId: number, userId?: number): Promise<Facture> {
    const facture = await this.findOne(factureId);

    if (facture.statut === 'annulee') {
      throw new BadRequestException('Cette facture est déjà annulée');
    }

    // Cancel all payments for this facture
    await this.cancelFacturePayments(factureId);

    // Update facture status
    facture.statut = 'annulee';
    facture.updated_at = new Date();
    if (userId) {
      facture.user_id = userId;
    }

    return this.factureRepository.save(facture);
  }

  private async generateInvoiceNumber(): Promise<string> {
    return this.numerotationsService.getNextNumber(NumerotationType.FACTURE);
  }

  // ============================================
  // CAISSE METHODS
  // ============================================

  /**
   * Generate PDF for a facture
   */
  async generatePdf(factureId: number, res: Response): Promise<void> {
    const facture = await this.factureRepository.findOne({
      where: { id: factureId },
      relations: ['commande', 'commande.client', 'commande.article'],
    });

    if (!facture) {
      throw new NotFoundException(`Facture with ID ${factureId} not found`);
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
      `attachment; filename="facture-${facture.numero_facture}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Default colors
    doc.fillColor('black');
    doc.strokeColor('black');

    // Draw Header
    let yPosition = drawPdfHeader(doc, infoAgence);

    const pageWidth = doc.page.width;
    const margin = 50;

    // Client info (left) and Invoice info (right)
    const client = facture.commande?.client;
    const clientStartY = yPosition;
    if (client) {
      doc.fillColor('black').font('Helvetica-Bold').fontSize(12);
      doc.text('Client:', margin, yPosition);
      yPosition += 15;

      doc.fillColor('black').font('Helvetica').fontSize(10);
      let clientInfo = '';
      if (client.type_client === 'Entreprise') {
        if (client.nom_entreprise) clientInfo += client.nom_entreprise + '\n';
        if (client.rc) clientInfo += `RC: ${client.rc}\n`;
        if (client.nif) clientInfo += `NIF: ${client.nif}\n`;
        if (client.nis) clientInfo += `NIS: ${client.nis}\n`;
      } else {
        if (client.nom_complet) clientInfo += client.nom_complet + '\n';
        if (client.numero_passeport) clientInfo += `Passeport: ${client.numero_passeport}\n`;
      }
      if (client.numero_mobile) clientInfo += `Tél: ${client.numero_mobile}\n`;
      if (client.email) clientInfo += `Email: ${client.email}`;

      if (clientInfo) {
        doc.fillColor('black').text(clientInfo.trim(), margin, yPosition);
        yPosition += doc.heightOfString(clientInfo.trim(), { width: 300 }) + 5;
      }
    }

    // Invoice info on the right
    const invoiceRightX = pageWidth - margin - 150;
    const invoiceStartY = clientStartY;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(14);
    doc.text('FACTURE', invoiceRightX, invoiceStartY, { align: 'right', width: 150 });

    doc.fillColor('black').font('Helvetica').fontSize(10);
    doc.text(`Numéro: ${facture.numero_facture}`, invoiceRightX, invoiceStartY + 20, { align: 'right', width: 150 });
    const factureDate = facture.date_facture ? new Date(facture.date_facture).toLocaleDateString('fr-FR') : 'N/A';
    doc.text(`Date: ${factureDate}`, invoiceRightX, invoiceStartY + 35, { align: 'right', width: 150 });
    const numeroCommande = facture.commande?.numero_bon_commande || (facture.commande?.id ? `#${facture.commande.id}` : 'N/A');
    doc.text(`Commande N°: ${numeroCommande}`, invoiceRightX, invoiceStartY + 50, { align: 'right', width: 150 });

    // Table header
    yPosition = Math.max(yPosition, invoiceStartY + 75) + 20;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
    doc.fillColor('#f0f0f0').rect(margin, yPosition, pageWidth - 2 * margin, 20).fill();
    doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 20).stroke();
    doc.fillColor('black').text('Article', margin + 5, yPosition + 5);
    doc.fillColor('black').text('Montant', pageWidth - margin - 100, yPosition + 5, { align: 'right', width: 95 });
    yPosition += 20;

    // Table rows
    doc.fillColor('black').font('Helvetica').fontSize(9);
    const article = facture.commande?.article;
    if (article) {
      doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 20).stroke();
      const articleWidth = pageWidth - 2 * margin - 110;
      addText(doc, article.label || 'Article', 9, false, hasArabicFont, { x: margin + 5, y: yPosition + 5, width: articleWidth });
      const prix = Number(facture.commande?.prix) || 0;
      doc.fillColor('black').font('Helvetica').text(`${prix.toFixed(2)} DA`, pageWidth - margin - 100, yPosition + 5, { align: 'right', width: 95 });
      yPosition += 20;
    }

    // Total row
    yPosition += 10;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(11);
    doc.fillColor('#f0f0f0').rect(margin, yPosition, pageWidth - 2 * margin, 25).fill();
    doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 25).stroke();
    doc.fillColor('black').text('TOTAL TTC:', margin + 5, yPosition + 7);
    const montantTTC = Number(facture.montant_ttc) || 0;
    doc.fillColor('black').text(`${montantTTC.toFixed(2)} DA`, pageWidth - margin - 100, yPosition + 7, { align: 'right', width: 95 });

    // Amount in words
    yPosition += 30;
    doc.fillColor('black').font('Helvetica').fontSize(9);
    doc.text(`Arrêté la présente facture à la somme de: ${numberToFrenchWords(montantTTC)}`, margin, yPosition);

    // Footer
    drawPdfFooter(doc, infoAgence);

    // Finalize PDF
    doc.end();
  }
}


