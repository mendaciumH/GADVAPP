import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Facture, FactureStatut } from '../entities/facture.entity';
import { Commande } from '../entities/commande.entity';
import { BonDeVersement } from '../entities/bon-de-versement.entity';
import { Client } from '../entities/client.entity';
import { Caisse } from '../entities/caisse.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { PayFactureDto } from './dto/pay-facture.dto';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { NumerotationsService } from '../numerotations/numerotations.service';
import { NumerotationType } from '../entities/numerotation.entity';
import { CaisseTransactionsService } from '../caisse-transactions/caisse-transactions.service';
import { TransactionType, ReferenceType } from '../entities/caisse-transaction.entity';

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
    const factures = await this.factureRepository.find({
      relations: ['commande', 'commande.client', 'commande.article'],
      order: { date_facture: 'DESC' },
    });

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
      relations: ['commande', 'commande.client', 'commande.article'],
    });

    if (!facture) {
      throw new NotFoundException(`Facture with ID ${id} not found`);
    }

    return facture;
  }

  async findByCommandeId(commandeId: number): Promise<Facture[]> {
    return this.factureRepository.find({
      where: { commande_id: commandeId },
      relations: ['commande', 'commande.client', 'commande.article'],
      order: { date_facture: 'DESC' },
    });
  }

  async generateFromCommande(commandeId: number, notes?: string): Promise<Facture> {
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
  }): Promise<Facture> {
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
   * Considers versements linked by facture_id OR by commande_id (for backward compatibility)
   */
  async getTotalPaid(factureId: number): Promise<number> {
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
   * Includes versements linked by facture_id OR by commande_id (for backward compatibility)
   */
  async getPaymentInfo(factureId: number): Promise<{ montantPaye: number; montantRestant: number; versements: BonDeVersement[] }> {
    const facture = await this.findOne(factureId);
    const montantPaye = await this.getTotalPaid(factureId);
    const montantTTC = Number(facture.montant_ttc) || 0;

    // Get versements linked directly to facture OR linked via commande
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

    return {
      montantPaye,
      montantRestant: Math.max(0, montantTTC - montantPaye),
      versements,
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

    return facture;
  }

  /**
   * Pay a facture (partial or full payment)
   */
  async payFacture(factureId: number, paymentDto: PayFactureDto, userId?: number): Promise<PaymentResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get facture with commande
      const facture = await this.factureRepository.findOne({
        where: { id: factureId },
        relations: ['commande', 'commande.client', 'commande.article'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!facture) {
        throw new NotFoundException(`Facture with ID ${factureId} not found`);
      }

      // Check if facture is not cancelled
      if (facture.statut === 'annulee') {
        throw new BadRequestException('Impossible de payer une facture annulée');
      }

      // Check if facture is not already fully paid
      if (facture.statut === 'payee') {
        throw new BadRequestException('Cette facture est déjà entièrement payée');
      }

      // Get remaining amount
      const montantRestant = await this.getRemainingAmount(factureId);
      const montantAPayer = Number(paymentDto.montant);

      // Validate payment amount
      if (montantAPayer <= 0) {
        throw new BadRequestException('Le montant doit être supérieur à 0');
      }

      if (montantAPayer > montantRestant) {
        throw new BadRequestException(
          `Le montant (${montantAPayer} DA) dépasse le montant restant à payer (${montantRestant.toFixed(2)} DA)`,
        );
      }

      // Generate bon de versement number
      const numeroBon = await this.generateBonNumber();

      // Create bon de versement
      const bonDeVersement = queryRunner.manager.create(BonDeVersement, {
        numero: numeroBon,
        date_versement: paymentDto.date_versement ? new Date(paymentDto.date_versement) : new Date(),
        client_id: facture.commande.client_id,
        commande_id: facture.commande_id,
        facture_id: factureId,
        montant_verse: montantAPayer,
        annule: false,
      });

      await queryRunner.manager.save(bonDeVersement);

      // Calculate new remaining amount
      const nouveauMontantRestant = montantRestant - montantAPayer;

      // Update facture status
      let newStatut: FactureStatut = facture.statut;
      if (nouveauMontantRestant <= 0) {
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

      const articleTypeId = facture.commande?.article?.id_type_article;
      await this.addToCaisse(montantAPayer, articleTypeId, userId, bonDeVersement.id);

      await queryRunner.commitTransaction();

      // Get total paid after this payment
      const totalPaid = await this.getTotalPaid(factureId);

      // Load bon de versement with relations
      const savedBon = await this.bonDeVersementRepository.findOne({
        where: { id: bonDeVersement.id },
        relations: ['client', 'commande', 'facture'],
      });

      return {
        facture: await this.findOne(factureId),
        bonDeVersement: savedBon!,
        montantPaye: totalPaid,
        montantRestant: nouveauMontantRestant,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
    finally {
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
  async cancelFacture(factureId: number): Promise<Facture> {
    const facture = await this.findOne(factureId);

    if (facture.statut === 'annulee') {
      throw new BadRequestException('Cette facture est déjà annulée');
    }

    // Cancel all payments for this facture
    await this.cancelFacturePayments(factureId);

    // Update facture status
    facture.statut = 'annulee';
    facture.updated_at = new Date();

    return this.factureRepository.save(facture);
  }

  private async generateBonNumber(): Promise<string> {
    return this.numerotationsService.getNextNumber(NumerotationType.BON_VERSEMENT);
  }

  private async generateInvoiceNumber(): Promise<string> {
    return this.numerotationsService.getNextNumber(NumerotationType.FACTURE);
  }

  // ============================================
  // CAISSE METHODS
  // ============================================

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
        ReferenceType.BON_VERSEMENT, // Payment via Facture creates BonDeVersement
        referenceId || 0, // Should pass BonDeVersement ID
        `Paiement Facture (Article Type: ${typeArticleId})`
      );

      console.log(`💰 Added ${montant} DZD to ${caisse.nom_caisse}.`);
    } catch (error) {
      console.error('Error adding to caisse:', error);
      // Don't throw - payment should still be recorded even if caisse update fails
    }
  }

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

    // Try to register Arabic font if available
    const fontsDir = join(process.cwd(), 'fonts');
    const amiriRegularPath = join(fontsDir, 'Amiri-Regular.ttf');
    const amiriBoldPath = join(fontsDir, 'Amiri-Bold.ttf');
    let hasArabicFont = false;

    if (existsSync(amiriRegularPath)) {
      try {
        const arabicFontRegular = readFileSync(amiriRegularPath);
        doc.registerFont('Amiri', arabicFontRegular);
        hasArabicFont = true;

        if (existsSync(amiriBoldPath)) {
          const arabicFontBold = readFileSync(amiriBoldPath);
          doc.registerFont('Amiri-Bold', arabicFontBold);
        } else {
          doc.registerFont('Amiri-Bold', arabicFontRegular);
        }
      } catch (error) {
        console.warn('Could not load Arabic font:', error);
      }
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="facture-${facture.numero_facture}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Set default colors to black
    doc.fillColor('black');
    doc.strokeColor('black');

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    let yPosition = margin;

    // Helper function to add Arabic text
    const addArabicText = (text: string, fontSize: number = 10, isBold: boolean = false, x: number = margin, y: number = yPosition, align: 'left' | 'right' | 'center' = 'left') => {
      if (hasArabicFont) {
        if (isBold) {
          doc.font('Amiri-Bold').fontSize(fontSize);
        } else {
          doc.font('Amiri').fontSize(fontSize);
        }
      } else {
        doc.fontSize(fontSize);
        if (isBold) {
          doc.font('Helvetica-Bold');
        } else {
          doc.font('Helvetica');
        }
      }
      doc.text(text, x, y, { align });
    };

    // Helper function to convert number to words (French)
    const numberToWords = (num: number): string => {
      const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

      const convertLessThanThousand = (n: number): string => {
        if (n === 0) return '';
        if (n < 20) return ones[n];

        if (n < 100) {
          const tens = Math.floor(n / 10);
          const remainder = n % 10;
          if (tens === 7 || tens === 9) {
            // 70-79, 90-99
            const base = tens === 7 ? 60 : 80;
            const extra = n - base;
            if (extra === 0) return tens === 7 ? 'soixante' : 'quatre-vingt';
            if (extra < 20) return (tens === 7 ? 'soixante' : 'quatre-vingt') + '-' + ones[extra];
            return (tens === 7 ? 'soixante' : 'quatre-vingt') + '-' + convertLessThanThousand(extra);
          }
          const tensWords = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
          if (remainder === 0) return tensWords[tens];
          if (remainder === 1 && tens !== 8) return tensWords[tens] + '-et-un';
          return tensWords[tens] + '-' + ones[remainder];
        }

        if (n < 1000) {
          const hundreds = Math.floor(n / 100);
          const remainder = n % 100;
          if (hundreds === 1) {
            return remainder === 0 ? 'cent' : 'cent-' + convertLessThanThousand(remainder);
          }
          return ones[hundreds] + '-cent' + (remainder === 0 ? '' : '-' + convertLessThanThousand(remainder));
        }

        return '';
      };

      if (num === 0) return 'zéro dinars';

      const integerPart = Math.floor(num);
      const decimalPart = Math.round((num - integerPart) * 100);

      let result = '';

      if (integerPart >= 1000000) {
        const millions = Math.floor(integerPart / 1000000);
        result += convertLessThanThousand(millions) + ' million' + (millions > 1 ? 's' : '') + ' ';
        const remainder = integerPart % 1000000;
        if (remainder > 0) result += convertLessThanThousand(remainder) + ' ';
      } else if (integerPart >= 1000) {
        const thousands = Math.floor(integerPart / 1000);
        result += convertLessThanThousand(thousands) + ' mille ';
        const remainder = integerPart % 1000;
        if (remainder > 0) result += convertLessThanThousand(remainder) + ' ';
      } else {
        result += convertLessThanThousand(integerPart) + ' ';
      }

      result = result.trim();
      result += 'dinars';

      if (decimalPart > 0) {
        result += ' et ' + convertLessThanThousand(decimalPart) + ' centimes';
      }

      return result.charAt(0).toUpperCase() + result.slice(1);
    };

    // Header: Logo (left) and Agency name (right)
    if (infoAgence?.logo) {
      try {
        const logoPath = join(process.cwd(), 'uploads', infoAgence.logo);
        if (existsSync(logoPath)) {
          const logoImage = readFileSync(logoPath);
          doc.image(logoImage, margin, yPosition, { width: 60, height: 60 });
        }
      } catch (error) {
        console.warn('Could not load logo:', error);
      }
    }

    // Agency name and info on the right - increased width for better display
    const rightSectionWidth = 300; // Increased from 200 to 300
    const rightX = pageWidth - margin - rightSectionWidth;
    if (infoAgence?.nom_agence) {
      doc.fillColor('black').font('Helvetica-Bold').fontSize(16);
      doc.text(infoAgence.nom_agence, rightX, yPosition, { align: 'right', width: rightSectionWidth });
      yPosition += 20;
    }

    // Agency details below name - formatted according to specifications
    doc.fillColor('black').font('Helvetica').fontSize(9);
    let agencyInfoLines: string[] = [];

    // Line 1: Tel and Fax
    let line1 = '';
    if (infoAgence?.tel) line1 += `Tel: ${infoAgence.tel}`;
    if (infoAgence?.fax) line1 += (line1 ? ' ' : '') + `Fax: ${infoAgence.fax}`;
    if (line1) agencyInfoLines.push(line1);

    // Line 2: Email with label
    if (infoAgence?.email) agencyInfoLines.push(`E-mail: ${infoAgence.email}`);

    // Line 3: RC and AR
    let line3 = '';
    if (infoAgence?.n_rc) line3 += `RC: ${infoAgence.n_rc}`;
    if (infoAgence?.ar) line3 += (line3 ? ' ' : '') + `AR: ${infoAgence.ar}`;
    if (line3) agencyInfoLines.push(line3);

    // Line 4: NIS
    if (infoAgence?.nis) agencyInfoLines.push(`NIS: ${infoAgence.nis}`);

    // Line 5: NIF and N° Licence
    let line5 = '';
    if (infoAgence?.nif) line5 += `NIF: ${infoAgence.nif}`;
    if (infoAgence?.n_licence) line5 += (line5 ? ' ' : '') + `N° Licence: ${infoAgence.n_licence}`;
    if (line5) agencyInfoLines.push(line5);

    // Line 6: N° IATA
    if (infoAgence?.code_iata) agencyInfoLines.push(`N° IATA: ${infoAgence.code_iata}`);

    // Line 7: RIB (separate line to avoid overlap)
    if (infoAgence?.rib) agencyInfoLines.push(`RIB: ${infoAgence.rib}`);

    // Draw agency info lines
    let currentY = yPosition;
    agencyInfoLines.forEach((line) => {
      doc.fillColor('black').text(line, rightX, currentY, { align: 'right', width: rightSectionWidth });
      currentY += 12;
    });
    yPosition = currentY;

    // Draw line - positioned after all agency info
    yPosition += 15;
    doc.strokeColor('black').lineWidth(1);
    doc.moveTo(margin, yPosition).lineTo(pageWidth - margin, yPosition).stroke();
    yPosition += 20;

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

    // Table header
    yPosition = Math.max(yPosition, invoiceStartY + 60) + 20;
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
      doc.fillColor('black').text(article.label || 'Article', margin + 5, yPosition + 5);
      const prix = Number(facture.commande?.prix) || 0;
      doc.fillColor('black').text(`${prix.toFixed(2)} DA`, pageWidth - margin - 100, yPosition + 5, { align: 'right', width: 95 });
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
    doc.text(`Arrêté la présente facture à la somme de: ${numberToWords(montantTTC)}`, margin, yPosition);

    // Footer
    if (infoAgence?.pied_facture) {
      yPosition = pageHeight - margin - 50;
      doc.fillColor('black').font('Helvetica').fontSize(8);
      doc.text(infoAgence.pied_facture, margin, yPosition, { align: 'center', width: pageWidth - 2 * margin });
    }

    // Finalize PDF
    doc.end();
  }
}

