import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonDeRemboursement } from '../entities/bon-de-remboursement.entity';
import { Client } from '../entities/client.entity';
import { Commande } from '../entities/commande.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { NumerotationsService } from '../numerotations/numerotations.service';
import { NumerotationType } from '../entities/numerotation.entity';
import { CreateBonDeRemboursementDto } from './dto/create-bon-de-remboursement.dto';
import { UpdateBonDeRemboursementDto } from './dto/update-bon-de-remboursement.dto';
import { CaisseTransactionsService } from '../caisse-transactions/caisse-transactions.service';
import { TransactionType, ReferenceType } from '../entities/caisse-transaction.entity';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { registerFonts, drawPdfHeader, drawPdfFooter, addText } from '../common/utils/pdf.utils';
import { numberToFrenchWords } from '../common/utils/number-to-words.helper';

@Injectable()
export class BonDeRemboursementService {
    constructor(
        @InjectRepository(BonDeRemboursement)
        private bonDeRemboursementRepository: Repository<BonDeRemboursement>,
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,
        @InjectRepository(Commande)
        private commandeRepository: Repository<Commande>,
        @InjectRepository(InfoAgence)
        private infoAgenceRepository: Repository<InfoAgence>,
        private numerotationsService: NumerotationsService,
        private caisseTransactionsService: CaisseTransactionsService,
    ) { }

    async findAll(): Promise<BonDeRemboursement[]> {
        return this.bonDeRemboursementRepository.find({
            relations: ['client', 'commande', 'commande.article'],
            order: { date_remboursement: 'DESC' },
        });
    }

    async findOne(id: number): Promise<BonDeRemboursement> {
        const bonDeRemboursement = await this.bonDeRemboursementRepository.findOne({
            where: { id },
            relations: ['client', 'commande', 'commande.article'],
        });

        if (!bonDeRemboursement) {
            throw new NotFoundException(`Bon de remboursement with ID ${id} not found`);
        }

        return bonDeRemboursement;
    }

    async findByCommandeId(commandeId: number): Promise<BonDeRemboursement[]> {
        return this.bonDeRemboursementRepository.find({
            where: { commande_id: commandeId },
            relations: ['client', 'commande', 'commande.article'],
            order: { date_remboursement: 'DESC' },
        });
    }

    async findByClientId(clientId: number): Promise<BonDeRemboursement[]> {
        return this.bonDeRemboursementRepository.find({
            where: { client_id: clientId },
            relations: ['client', 'commande', 'commande.article'],
            order: { date_remboursement: 'DESC' },
        });
    }

    async create(createBonDeRemboursementDto: CreateBonDeRemboursementDto, userId?: number): Promise<BonDeRemboursement> {
        // Validate client exists
        const client = await this.clientRepository.findOne({
            where: { id: createBonDeRemboursementDto.client_id },
        });

        if (!client) {
            throw new NotFoundException(`Client with ID ${createBonDeRemboursementDto.client_id} not found`);
        }

        // Validate commande exists and get article for caisse selection
        const commande = await this.commandeRepository.findOne({
            where: { id: createBonDeRemboursementDto.commande_id },
            relations: ['article'],
        });

        if (!commande) {
            throw new NotFoundException(`Commande with ID ${createBonDeRemboursementDto.commande_id} not found`);
        }

        // Verify that the commande belongs to the client
        if (Number(commande.client_id) !== Number(createBonDeRemboursementDto.client_id)) {
            throw new BadRequestException('La commande n\'appartient pas au client spécifié');
        }

        // Generate numero if not provided
        const numero = createBonDeRemboursementDto.numero || await this.generateNumero();

        // Check if numero already exists
        const existingBon = await this.bonDeRemboursementRepository.findOne({
            where: { numero },
        });

        if (existingBon) {
            throw new BadRequestException(`Le numéro ${numero} existe déjà`);
        }

        const dateRemboursement = createBonDeRemboursementDto.date_remboursement
            ? new Date(createBonDeRemboursementDto.date_remboursement)
            : new Date();

        const bonDeRemboursement = this.bonDeRemboursementRepository.create({
            numero,
            date_remboursement: dateRemboursement,
            client_id: createBonDeRemboursementDto.client_id,
            commande_id: createBonDeRemboursementDto.commande_id,
            montant: createBonDeRemboursementDto.montant,
            motif: createBonDeRemboursementDto.motif || null,
            user_id: userId,
        } as BonDeRemboursement);

        const savedBon = await this.bonDeRemboursementRepository.save(bonDeRemboursement);

        // Handle Caisse Transaction (Décaissement)
        try {
            // Determine which caisse to use based on Article Type
            const caisse = await this.caisseTransactionsService.findCaisseForArticleType(commande.article?.id_type_article);

            if (caisse) {
                await this.caisseTransactionsService.createTransaction(
                    caisse.id,
                    userId || null,
                    TransactionType.DECAISSEMENT,
                    Number(savedBon.montant),
                    ReferenceType.BON_REMBOURSEMENT,
                    savedBon.id,
                    `Remboursement Comande #${commande.id} - ${savedBon.numero}`,
                );
            }
        } catch (error) {
            console.error('Failed to create caisse transaction for remboursement:', error);
            // We don't rollback the bon creation, but we log the error
        }

        return savedBon;
    }

    async update(
        id: number,
        updateBonDeRemboursementDto: UpdateBonDeRemboursementDto,
        userId?: number,
    ): Promise<BonDeRemboursement> {
        const bonDeRemboursement = await this.findOne(id);

        // Validate client if provided
        if (updateBonDeRemboursementDto.client_id) {
            const client = await this.clientRepository.findOne({
                where: { id: updateBonDeRemboursementDto.client_id },
            });

            if (!client) {
                throw new NotFoundException(`Client with ID ${updateBonDeRemboursementDto.client_id} not found`);
            }
        }

        // Validate commande if provided
        if (updateBonDeRemboursementDto.commande_id) {
            const commande = await this.commandeRepository.findOne({
                where: { id: updateBonDeRemboursementDto.commande_id },
            });

            if (!commande) {
                throw new NotFoundException(`Commande with ID ${updateBonDeRemboursementDto.commande_id} not found`);
            }

            // Verify that the commande belongs to the client
            const clientId = updateBonDeRemboursementDto.client_id || bonDeRemboursement.client_id;
            if (Number(commande.client_id) !== Number(clientId)) {
                throw new BadRequestException('La commande n\'appartient pas au client spécifié');
            }
        }

        // Check numero uniqueness if provided
        if (updateBonDeRemboursementDto.numero && updateBonDeRemboursementDto.numero !== bonDeRemboursement.numero) {
            const existingBon = await this.bonDeRemboursementRepository.findOne({
                where: { numero: updateBonDeRemboursementDto.numero },
            });

            if (existingBon) {
                throw new BadRequestException(`Le numéro ${updateBonDeRemboursementDto.numero} existe déjà`);
            }
        }

        Object.assign(bonDeRemboursement, {
            ...(updateBonDeRemboursementDto.numero !== undefined && { numero: updateBonDeRemboursementDto.numero }),
            ...(updateBonDeRemboursementDto.date_remboursement !== undefined && {
                date_remboursement: new Date(updateBonDeRemboursementDto.date_remboursement)
            }),
            ...(updateBonDeRemboursementDto.client_id !== undefined && { client_id: updateBonDeRemboursementDto.client_id }),
            ...(updateBonDeRemboursementDto.commande_id !== undefined && { commande_id: updateBonDeRemboursementDto.commande_id }),
            ...(updateBonDeRemboursementDto.montant !== undefined && { montant: updateBonDeRemboursementDto.montant }),
            ...(updateBonDeRemboursementDto.motif !== undefined && { motif: updateBonDeRemboursementDto.motif }),
            ...(updateBonDeRemboursementDto.motif !== undefined && { motif: updateBonDeRemboursementDto.motif }),
            updated_at: new Date(),
            user_id: userId,
        });

        return this.bonDeRemboursementRepository.save(bonDeRemboursement);
    }

    async remove(id: number): Promise<void> {
        const bonDeRemboursement = await this.findOne(id);
        await this.bonDeRemboursementRepository.remove(bonDeRemboursement);
    }

    async generatePdf(bonDeRemboursementId: number, res: Response): Promise<void> {
        // Fetch bon de remboursement with relations
        const bonDeRemboursement = await this.bonDeRemboursementRepository.findOne({
            where: { id: bonDeRemboursementId },
            relations: ['client', 'commande', 'commande.client', 'commande.article'],
        });

        if (!bonDeRemboursement) {
            throw new NotFoundException(`Bon de remboursement with ID ${bonDeRemboursementId} not found`);
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
            `attachment; filename="bon-de-remboursement-${bonDeRemboursement.numero}.pdf"`,
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
        addText(doc, 'BON DE REMBOURSEMENT', 20, true, hasArabicFont, { align: 'center', y: yPos });
        yPos += 40;

        // Bon de remboursement details
        const client = bonDeRemboursement.commande?.client || bonDeRemboursement.client;
        const clientName = client?.type_client === 'Entreprise'
            ? client.nom_entreprise
            : client?.nom_complet || 'N/A';

        // Table-like layout
        const lineHeight = 20;
        const labelWidth = 150;
        const valueWidth = contentWidth - labelWidth;

        // Numéro
        addText(doc, 'Numéro:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
        addText(doc, bonDeRemboursement.numero, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
        yPos += lineHeight;

        // Date de remboursement
        const dateRemboursement = bonDeRemboursement.date_remboursement
            ? new Date(bonDeRemboursement.date_remboursement).toLocaleDateString('fr-FR')
            : 'N/A';
        addText(doc, 'Date de remboursement:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
        addText(doc, dateRemboursement, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
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
        if (bonDeRemboursement.commande) {
            addText(doc, 'INFORMATIONS COMMANDE', 14, true, hasArabicFont, { x: margin, y: yPos });
            yPos += lineHeight;

            addText(doc, 'Commande N°:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
            addText(doc, `#${bonDeRemboursement.commande.id}`, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
            yPos += lineHeight;

            if (bonDeRemboursement.commande.article?.label) {
                addText(doc, 'Article:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
                addText(doc, bonDeRemboursement.commande.article.label, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
                yPos += lineHeight;
            }

            if (bonDeRemboursement.commande.prix) {
                addText(doc, 'Prix commande:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
                addText(doc, `${Number(bonDeRemboursement.commande.prix).toFixed(2)} DA`, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
                yPos += lineHeight;
            }
        }

        yPos += lineHeight * 0.5;

        // Motif if provided
        if (bonDeRemboursement.motif) {
            addText(doc, 'Motif du remboursement:', 12, true, hasArabicFont, { x: margin, y: yPos, width: labelWidth });
            addText(doc, bonDeRemboursement.motif, 12, false, hasArabicFont, { x: margin + labelWidth, y: yPos, width: valueWidth });
            yPos += lineHeight * 1.5;
        } else {
            yPos += lineHeight;
        }

        // Montant remboursé (highlighted)
        doc.rect(margin, yPos, contentWidth, lineHeight * 2).stroke();
        addText(doc, 'MONTANT REMBOURSÉ', 14, true, hasArabicFont, { x: margin + 10, y: yPos + 10, width: contentWidth - 20, align: 'center' });
        yPos += lineHeight;
        const montant = Number(bonDeRemboursement.montant);
        addText(doc, `${montant.toFixed(2)} DA`, 18, true, hasArabicFont, { x: margin + 10, y: yPos + 5, width: contentWidth - 20, align: 'center' });
        yPos += lineHeight * 2.5;

        // Amount in words
        doc.fillColor('black').font('Helvetica').fontSize(9);
        doc.text(`Arrêté le présent bon à la somme de: ${numberToFrenchWords(montant)}`, margin, yPos);

        // Footer
        drawPdfFooter(doc, infoAgence);

        // Finalize PDF
        doc.end();
    }

    private async generateNumero(): Promise<string> {
        return this.numerotationsService.getNextNumber(NumerotationType.BON_REMBOURSEMENT);
    }
}
