import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commande } from '../entities/commande.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { registerFonts, drawPdfHeader, drawPdfFooter, addText } from '../common/utils/pdf.utils';
import { numberToFrenchWords } from '../common/utils/number-to-words.helper';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
    @InjectRepository(InfoAgence)
    private infoAgenceRepository: Repository<InfoAgence>,
  ) { }

  async generateTravelContract(commandeId: number, res: Response): Promise<void> {
    // Fetch commande with relations
    const commande = await this.commandeRepository.findOne({
      where: { id: commandeId },
      relations: ['client', 'article'],
    });

    if (!commande) {
      throw new NotFoundException(`Commande with ID ${commandeId} not found`);
    }

    // Fetch agency info
    const infoAgence = await this.infoAgenceRepository.findOne({
      where: { id: 1 },
    });

    // Create PDF document with very minimal margins for single page fit
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
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
      `attachment; filename="contrat-voyage-${commandeId}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to add Arabic text with ultra-minimal spacing
    const addArabicText = (text: string, fontSize: number = 10, isBold: boolean = false, options: any = {}) => {
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
        align: 'right',
        features: ['rtla'],
        lineGap: 0,
        ...options,
      };

      doc.text(text, defaultOptions);
    };

    // Title - centered, compact
    doc.fontSize(14).font(hasArabicFont ? 'Amiri-Bold' : 'Helvetica-Bold');
    doc.text('عقد السفر', { align: 'center', features: ['rtla'] });
    doc.moveDown(0.1);

    // Calculate column dimensions with tighter spacing
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 20;
    const columnGap = 6;
    const columnWidth = (pageWidth - 2 * margin - columnGap) / 2;
    const startY = doc.y;
    let rightColumnY = startY;
    let leftColumnY = startY;

    // RIGHT COLUMN (Sections 1-6) - Visually on the right side of the page
    const rightColumnX = margin + columnWidth + columnGap;

    // Section 1
    doc.x = rightColumnX;
    doc.y = rightColumnY;
    addArabicText('1- موضوع العقد', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('يهدف هذا العقد الى تنظيم العلاقات بين الوكالة والزبونب مجرد ان جسد هذا الأخير طلبه للحجز', 9, false, { width: columnWidth });
    rightColumnY = doc.y + 0.5;

    // Section 2
    doc.x = rightColumnX;
    doc.y = rightColumnY;
    addArabicText('2- تصريح الزبون :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('1/2- يصرح الزبون ويضمن بان جميع المعلومات الخاصة به والواردة في هذا العقد معلومات صادقة وصحيحة', 9, false, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('2/2 - يصرح الزبون بانه قد اطلع على جميع شروط سفره وانه موافق عليها وليس له اي تحفظ', 9, false, { width: columnWidth });
    rightColumnY = doc.y + 0.5;

    // Section 3
    doc.x = rightColumnX;
    doc.y = rightColumnY;
    addArabicText('3- تصريح الوكالة :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('1/3- تصريح الوكالة وتضمن بانها معتمدة ومرخص لها من حيث كل الجوانب بيع مستحقات السفر وتسري عليها القوانين المعمول بها .', 9, false, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('2/3- تصريح الوكالة وتضمن بانها ستؤدي جميع الخدمات الواردة في هذا العقد وذلك طبقا لاصول المهنة .', 9, false, { width: columnWidth });
    rightColumnY = doc.y + 0.5;

    // Section 4
    doc.x = rightColumnX;
    doc.y = rightColumnY;
    addArabicText('4- الاسعار المطبقة :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('الاسعار المطبقة هي تلك المبينة في وجه هذا العقد', 9, false, { width: columnWidth });
    rightColumnY = doc.y + 0.5;

    // Section 5
    doc.x = rightColumnX;
    doc.y = rightColumnY;
    addArabicText('5- المسؤوليات :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('1/5- مسؤولية الوكالة :', 9, true, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('لا يجوز اعتبار الوكالة مسؤولة عن عواقب المخالفات في حق الانظمة المعمول بها في مختلف البلدان سواء فيما يتعلق بالإجراءات الجمركية او قوانين الشرطة او خاصيات محلية اخرى . وكذلك الأمر بالنسبة للحالات القاهرة ) اضرابات . تأخرات . حوادث تقنية ..... ( .', 9, false, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('جميع البيانات المتعلقة بالاسعار والمواقيت وكذا جميع المعلومات الصادرة من الوكالة ليست سوى على سبيل البيان ولا تشكل التزاما منها', 9, false, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('2/5- مسؤولية الزبون :', 9, true, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('لا يجوز في أي حال من الاحوال استرداد سعر الرحلة عند عدم حضور الزبون في الساعات والاماكن المبينة في وثائق السفر او عدم استظهاره لوثائق الضرورية للرحلة أو الاقامة ) جواز السفر . التأشيرة . شهادات لتلقيح .... ( .', 9, false, { width: columnWidth });
    rightColumnY = doc.y + 0.5;

    // Section 6
    doc.x = rightColumnX;
    doc.y = rightColumnY;
    addArabicText('6- الشروط الخاصة :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('بعد عمليات الحجز على الرحلات الجوية غير العادية ) شارتار ( ثابتة ونهائية ولا يمكن بالتالي تقديمها او تاجيلها .', 9, false, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('في حالة اقدام الزبون على الغاء سفره في الاجال المححدة في الشروط لأي سبب كان . فلا يجوز له المطالبة بأي تعويض كان .', 9, false, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('بعد تذكرة السفر على الرحلات الجوية غير العادية ) شارتر ( شخصية غير قابلة للتنازل او التحويل او التطهير للغير', 9, false, { width: columnWidth });

    // LEFT COLUMN (Sections 7, 8, 9, and قيد خاص بالعمرة) - Visually on the left side of the page
    const leftColumnX = margin;

    // Section 7
    doc.x = leftColumnX;
    doc.y = leftColumnY;
    addArabicText('7- الالغاء :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('1/7- من طرف المنظم :', 9, true, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('الوكالة غير مسؤولة عن الغاء او تغيير جزئي أو كلي للرحلة المنظمة في حالة القوة القاهرة والكوارث الطبيعية او الغاء الرحلة من طرف الشركة الناقلة . وستسعى في هذه الحالات بالمحافظة على حقوق الزبون بتوفير بديل مكافئ للرحلة أو طلب تعويض كلي أو جزئي من المتعاملين المضيفين أو الشركة الناقلة .', 9, false, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('2/7- من طرف الزبون :', 9, true, { width: columnWidth });
    doc.moveDown(0.02);
    addArabicText('في حالة الالغاء الكلي أو الجزئي للرحلة من طرف الزبون لأي سبب كان فسيتحمل كل الغرامات والمصاريف الناتجة عن ذلك وتطبق عليه الاحكام والشروط المطبقة من طرف المتعاملين المضيفين والشركات الناقلة المتعاقد معها وكذا مصالح القنصلية بالنسبة للتأشيرة .', 9, false, { width: columnWidth });
    leftColumnY = doc.y + 0.5;

    // Section 8
    doc.x = leftColumnX;
    doc.y = leftColumnY;
    addArabicText('8- شروط والتزامات خاصة بالزبائن :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('- الوكالة لا تتحمل توابع عدم السماح للزبون من السفر مهما كانت الاسباب ) امنية او شخصية ..... (', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- الوكالة غير مسؤولة عن أي تأخر أو ضياع للأمتعة ذهابا او ايابا', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- الوكالة غير مسؤولة عن الحالة الصحية للزبون اثناء رحلة الطيران', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- الوكالة غير مسؤولة عن عدم استفادة الزبون من التأشيرة او تأخرها .', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- يجب مراعاة الأنظمة واللوائح والتعليمات السارية المفعول بها بالبلد المضيف . ولهذا فان الوكالة غير مسؤولية عن المتابعات القضائية للزبون من طرف حكومة البلد المستقبل', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- الوكالة غير مسؤولة عن التعرض لسرقة الاشياء الثمينة أو ضياعها.', 9, false, { width: columnWidth });
    leftColumnY = doc.y + 0.5;

    // Section 9
    doc.x = leftColumnX;
    doc.y = leftColumnY;
    addArabicText('9- تسوية النزاعات :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('كل نزاع مترتب عن تطبيق هذا العقد سيسوى بالتراضي وذلك بعد اشعار الوكالة من طرف الزبون في اجل لا يتعدى 15 يوما من تاريخ عودته من الرحلة واذا تعذر ذلك فيرفع امام الجهات القضائية لدائرة اختصاص المقر الاجتماعي للوكالة .', 9, false, { width: columnWidth });
    leftColumnY = doc.y + 0.5;

    // Special Note for Umrah
    doc.x = leftColumnX;
    doc.y = leftColumnY;
    addArabicText('قيد خاص بالعمرة :', 9, true, { width: columnWidth });
    doc.moveDown(0.05);
    addArabicText('- على الزبون دفع كل الرسوم المفروضة لدخول المملكة العربية السعودية', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- في حال تخلف المعتمر عن برنامجه لاي سبب كان يلتزم بتحمل كل مسؤولياته في المملكة ودفع الرسوم الناجمة عن تخلفه', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- وجوب مغادرة المملكة العربية السعودية بعد انتهاء مدة التأشيرة لأداء الحج والعمرة وعدم العمل مهما كانت الأسباب', 9, false, { width: columnWidth });
    doc.moveDown(0.015);
    addArabicText('- في حالة الغى المعتمر تسجيله بعد صدور التأشيرة سيتم خصم مبلغ  :  30000.00  دج ولا يسلم له الجواز الا بعد انتهاء صلاحية التأشيرة', 9, false, { width: columnWidth });

    // Continue in single column (full width) for notes at bottom
    const notesStartY = Math.max(doc.y, rightColumnY) + 2;
    doc.x = margin;
    doc.y = notesStartY;

    // General Notes - Full width, compact
    addArabicText('تنبيه عام :', 9, true, { width: pageWidth - 2 * margin });
    doc.moveDown(0.05);
    addArabicText('1- يجب اصطحاب الدفتر العائلي للاباء المرافقين لابنائهم الأقل من 19 سنة', 9, false, { width: pageWidth - 2 * margin });
    doc.moveDown(0.015);
    addArabicText('2- يجب اصطحاب تصريح ابوي لمغادرة التراب الوطني صادرة من محافظة الشرطة للاشخاص الأقل من 19 سنة', 9, false, { width: pageWidth - 2 * margin });
    doc.moveDown(0.015);
    addArabicText('3- يجب اصطحاب اذن الخروج من التراب الوطني للموظفين الحكوميين من جهات المختصة', 9, false, { width: pageWidth - 2 * margin });
    doc.moveDown(0.015);
    addArabicText('4- التأكد من احضار جميع الوثائق المطلوبة : جواز السفر . تذكرة السفر', 9, false, { width: pageWidth - 2 * margin });
    doc.moveDown(0.015);
    addArabicText('5- في حالة الإصابة باي مرض مزمن يرجى التأكد من احضار الأدوية اللازمة .', 9, false, { width: pageWidth - 2 * margin });
    doc.moveDown(0.05);

    // Special Notes for Umrah - Full width, compact
    addArabicText('تنبيه خاص بالعمرة :', 9, true, { width: pageWidth - 2 * margin });
    doc.moveDown(0.05);
    addArabicText('1- الحضور 5 ساعات قبل موعد الرحلة وأي تخلف عن ساعة الإقلاع يتحمل الزبون مسؤوليته .', 9, false, { width: pageWidth - 2 * margin });
    doc.moveDown(0.015);
    addArabicText('2- التأكد دوما من حمل بطاقة المعتمر عقد السفر . دليل المعتمر .', 9, false, { width: pageWidth - 2 * margin });
    doc.moveDown(0.015);
    addArabicText('3- يجب على المعتمر القيام بالتطعيم الموصى به من طرف السلطات السعودية واحضار دفتره معه .', 9, false, { width: pageWidth - 2 * margin });

    // Signatures at the bottom - ensure on first page
    const currentY = doc.y;
    const signatureY = Math.min(currentY + 5, pageHeight - 30);

    // Force position to ensure it's on first page
    doc.y = signatureY;

    if (hasArabicFont) {
      doc.fontSize(9).font('Amiri-Bold');
    } else {
      doc.fontSize(9).font('Helvetica-Bold');
    }

    doc.text('امضاء الوكالة', margin, signatureY, {
      width: (pageWidth - 2 * margin) / 2,
      align: 'left',
      features: ['rtla'],
    });
    doc.moveTo(margin, signatureY + 10);
    doc.lineTo(margin + 80, signatureY + 10);
    doc.stroke();

    doc.text('امضاء الزبون', margin + (pageWidth - 2 * margin) / 2, signatureY, {
      width: (pageWidth - 2 * margin) / 2,
      align: 'right',
      features: ['rtla'],
    });
    doc.moveTo(pageWidth - margin - 80, signatureY + 10);
    doc.lineTo(pageWidth - margin, signatureY + 10);
    doc.stroke();

    // Finalize PDF
    doc.end();
  }

  async generateBonDeCommande(commandeId: number, res: Response): Promise<void> {
    // Fetch commande with relations
    const commande = await this.commandeRepository.findOne({
      where: { id: commandeId },
      relations: ['client', 'article'],
    });

    if (!commande) {
      throw new NotFoundException(`Commande with ID ${commandeId} not found`);
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
      `attachment; filename="bon-de-commande-${commandeId}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Default colors
    doc.fillColor('black');
    doc.strokeColor('black');

    // Draw Header
    let yPosition = drawPdfHeader(doc, infoAgence);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;

    // Client info (left) and Order info (right)
    const client = commande.client;
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

    // Order info on the right
    const orderRightX = pageWidth - margin - 150;
    const orderStartY = clientStartY;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(14);
    doc.text('BON DE COMMANDE', orderRightX, orderStartY, { align: 'right', width: 150 });

    doc.fillColor('black').font('Helvetica').fontSize(10);
    const numeroDisplay = commande.numero_bon_commande || `#${commandeId}`;
    doc.text(`Numéro: ${numeroDisplay}`, orderRightX, orderStartY + 20, { align: 'right', width: 150 });
    const commandeDate = commande.date ? new Date(commande.date).toLocaleDateString('fr-FR') : 'N/A';
    doc.text(`Date: ${commandeDate}`, orderRightX, orderStartY + 35, { align: 'right', width: 150 });

    // Beneficiary info section
    yPosition = Math.max(yPosition, orderStartY + 60) + 20;
    if (commande.beneficiaire) {
      doc.fillColor('black').font('Helvetica-Bold').fontSize(12);
      doc.text('Bénéficiaire:', margin, yPosition);
      yPosition += 15;

      doc.fillColor('black').font('Helvetica').fontSize(10);
      let beneficiaryInfo = '';
      if (commande.nom) beneficiaryInfo += `Nom: ${commande.nom}\n`;
      if (commande.prenom) beneficiaryInfo += `Prénom: ${commande.prenom}\n`;
      if (commande.date_naissance) {
        const birthDate = new Date(commande.date_naissance).toLocaleDateString('fr-FR');
        beneficiaryInfo += `Date de naissance: ${birthDate}\n`;
      }
      if (commande.genre) beneficiaryInfo += `Genre: ${commande.genre}\n`;
      if (commande.numero_passport) beneficiaryInfo += `N° Passeport: ${commande.numero_passport}\n`;
      if (commande.date_expiration_passport) {
        const expDate = new Date(commande.date_expiration_passport).toLocaleDateString('fr-FR');
        beneficiaryInfo += `Expiration passeport: ${expDate}\n`;
      }
      if (commande.numero_mobile) beneficiaryInfo += `Tél: ${commande.numero_mobile}`;

      if (beneficiaryInfo) {
        doc.fillColor('black').text(beneficiaryInfo.trim(), margin, yPosition);
        yPosition += doc.heightOfString(beneficiaryInfo.trim(), { width: 300 }) + 10;
      }
    }

    // Table header
    yPosition += 10;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
    doc.fillColor('#f0f0f0').rect(margin, yPosition, pageWidth - 2 * margin, 20).fill();
    doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 20).stroke();
    doc.fillColor('black').text('Service', margin + 5, yPosition + 5);
    doc.fillColor('black').text('Prix', pageWidth - margin - 100, yPosition + 5, { align: 'right', width: 95 });
    yPosition += 20;

    // Table rows
    doc.fillColor('black').font('Helvetica').fontSize(9);
    const article = commande.article;
    const prix = Number(commande.prix) || 0;
    if (article) {
      doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 20).stroke();
      addText(doc, article.label || 'Service', 9, false, hasArabicFont, { x: margin + 5, y: yPosition + 5 });
      doc.fillColor('black').font('Helvetica').text(`${prix.toFixed(2)} DA`, pageWidth - margin - 100, yPosition + 5, { align: 'right', width: 95 });
      yPosition += 20;
    }

    // Reductions row (if any)
    const reductions = Number(commande.reductions) || 0;
    const autreReductions = Number(commande.autre_reductions) || 0;
    const totalReductions = reductions + autreReductions;

    if (totalReductions > 0) {
      doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 20).stroke();
      doc.fillColor('black').text('Réductions', margin + 5, yPosition + 5);
      doc.fillColor('black').text(`-${totalReductions.toFixed(2)} DA`, pageWidth - margin - 100, yPosition + 5, { align: 'right', width: 95 });
      yPosition += 20;
    }

    // Taxes row (if any)
    const taxes = Number(commande.taxes) || 0;
    if (taxes > 0) {
      doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 20).stroke();
      doc.fillColor('black').text('Taxes', margin + 5, yPosition + 5);
      doc.fillColor('black').text(`${taxes.toFixed(2)} DA`, pageWidth - margin - 100, yPosition + 5, { align: 'right', width: 95 });
      yPosition += 20;
    }

    // Total row
    yPosition += 10;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(11);
    doc.fillColor('#f0f0f0').rect(margin, yPosition, pageWidth - 2 * margin, 25).fill();
    doc.strokeColor('black').rect(margin, yPosition, pageWidth - 2 * margin, 25).stroke();
    doc.fillColor('black').text('TOTAL:', margin + 5, yPosition + 7);
    const montantTotal = prix - totalReductions + taxes;
    doc.fillColor('black').text(`${montantTotal.toFixed(2)} DA`, pageWidth - margin - 100, yPosition + 7, { align: 'right', width: 95 });

    // Amount in words
    yPosition += 30;
    doc.fillColor('black').font('Helvetica').fontSize(9);
    doc.text(`Arrêté le présent bon à la somme de: ${numberToFrenchWords(montantTotal)}`, margin, yPosition);

    // Remarks (if any)
    if (commande.remarques) {
      yPosition += 20;
      doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
      doc.text('Remarques:', margin, yPosition);
      yPosition += 15;

      // Use addText for remarks as they might contain Arabic
      addText(doc, commande.remarques, 9, false, hasArabicFont, { x: margin, y: yPosition, width: pageWidth - 2 * margin });

      // Approximate height of remarks (or let pdfkit handle flow if we weren't doing manual positioning, 
      // but here we are. Simplified estimate or relying on footer being at bottom)
      // Since footer is fixed at bottom, remarks valid until then.
    }

    // Footer
    drawPdfFooter(doc, infoAgence);

    // Finalize PDF
    doc.end();
  }
}
