import { PDFDocument, rgb } from 'pdf-lib';
import * as fs from 'fs';

export class PdfService {

    async replaceLogo(
        inputPdfBuffer: Buffer,
        logoBuffer: Buffer
    ): Promise<Buffer> {

        const pdfDoc = await PDFDocument.load(inputPdfBuffer);
        const pages = pdfDoc.getPages();

        const logoImage = await pdfDoc.embedPng(logoBuffer);

        for (const page of pages) {
            const { width, height } = page.getSize();

            // 1️⃣ Cover old logo (example top-left)
            page.drawRectangle({
                x: 30,
                y: height - 100,
                width: 150,
                height: 60,
                color: rgb(1, 1, 1), // white
            });

            // 2️⃣ Draw new logo
            page.drawImage(logoImage, {
                x: 30,
                y: height - 100,
                width: 120,
                height: 50,
            });
        }

        return Buffer.from(await pdfDoc.save());
    }
}
