import * as PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { InfoAgence } from '../../entities/info-agence.entity';

export function registerFonts(doc: PDFKit.PDFDocument): boolean {
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
    return hasArabicFont;
}

export function drawPdfHeader(doc: PDFKit.PDFDocument, infoAgence: InfoAgence | null): number {
    const pageWidth = doc.page.width;
    const margin = 50;
    let yPosition = margin;

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

    // Agency name and info on the right
    const rightSectionWidth = 300;
    const rightX = pageWidth - margin - rightSectionWidth;
    if (infoAgence?.nom_agence) {
        doc.fillColor('black').font('Helvetica-Bold').fontSize(16);
        doc.text(infoAgence.nom_agence, rightX, yPosition, { align: 'right', width: rightSectionWidth });
        yPosition += 20;
    }

    // Agency details below name
    doc.fillColor('black').font('Helvetica').fontSize(9);
    let agencyInfoLines: string[] = [];

    // Line 1: Tel and Fax
    let line1 = '';
    if (infoAgence?.tel) line1 += `Tel: ${infoAgence.tel}`;
    if (infoAgence?.fax) line1 += (line1 ? ' ' : '') + `Fax: ${infoAgence.fax}`;
    if (line1) agencyInfoLines.push(line1);

    // Line 2: Email
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

    // Line 7: RIB
    if (infoAgence?.rib) agencyInfoLines.push(`RIB: ${infoAgence.rib}`);

    // Draw agency info lines
    let currentY = yPosition;
    agencyInfoLines.forEach((line) => {
        doc.fillColor('black').text(line, rightX, currentY, { align: 'right', width: rightSectionWidth });
        currentY += 12;
    });
    yPosition = currentY;

    // Draw line
    yPosition += 15;
    doc.strokeColor('black').lineWidth(1);
    doc.moveTo(margin, yPosition).lineTo(pageWidth - margin, yPosition).stroke();
    yPosition += 20;

    return yPosition;
}

export function drawPdfFooter(doc: PDFKit.PDFDocument, infoAgence: InfoAgence | null): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;
    const footerY = pageHeight - margin - 50;

    if (infoAgence?.pied_facture) {
        doc.fillColor('black').font('Helvetica').fontSize(8);
        doc.text(infoAgence.pied_facture, margin, footerY, { align: 'center', width: contentWidth });
    } else {
        // Fallback or additional standard footer info if pied_facture is missing or to supplement it
        // (Matching logic seen in bon-de-remboursement/versement which has dynamic footer generation)
        let currentFooterY = footerY;
        doc.fontSize(10); // Reset font size if coming from pied_facture check

        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, currentFooterY, {
            width: contentWidth,
            align: 'center'
        });

        if (infoAgence?.adresse) {
            currentFooterY += 15;
            doc.text(infoAgence.adresse, margin, currentFooterY, {
                width: contentWidth,
                align: 'center'
            });
        }

        if (infoAgence?.tel) {
            currentFooterY += 15;
            doc.text(`Tél: ${infoAgence.tel}`, margin, currentFooterY, {
                width: contentWidth,
                align: 'center'
            });
        }
    }
}

export function addText(
    doc: PDFKit.PDFDocument,
    text: string,
    fontSize: number = 10,
    isBold: boolean = false,
    hasArabicFont: boolean = false,
    options: any = {}
): void {
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

    const defaultOptions = {
        align: 'left',
        features: ['rtla'],
        ...options,
    };

    doc.text(text, defaultOptions);
}
