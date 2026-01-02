import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PDFDocument, PDFImage, rgb } from 'pdf-lib';
import { FileStorageService } from './file-storage.service';
import { ReplaceLogoDto } from './dto/replace-logo.dto';

@Injectable()
export class PdfProcessingService {
    private readonly logger = new Logger(PdfProcessingService.name);

    constructor(private readonly fileStorageService: FileStorageService) { }

    /**
     * Replace logo in PDF document
     */
    async replaceLogo(dto: ReplaceLogoDto): Promise<string> {
        try {
            this.logger.log(`Starting logo replacement for PDF: ${dto.pdfFileId}`);

            // Load PDF document
            const pdfPath = this.fileStorageService.getFilePath(dto.pdfFileId);
            const pdfBytes = await this.fileStorageService.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            // Validate page number
            const totalPages = pdfDoc.getPageCount();
            if (dto.pageNumber < 1 || dto.pageNumber > totalPages) {
                throw new BadRequestException(
                    `Invalid page number. PDF has ${totalPages} pages.`,
                );
            }

            // Get the target page (pages are 0-indexed)
            const page = pdfDoc.getPage(dto.pageNumber - 1);
            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Load logo image
            const logoPath = this.fileStorageService.getFilePath(dto.logoFileId);
            const logoBytes = await this.fileStorageService.readFile(logoPath);

            let logoImage: PDFImage;
            const logoExtension = logoPath.toLowerCase();

            if (logoExtension.endsWith('.png')) {
                logoImage = await pdfDoc.embedPng(logoBytes);
            } else if (logoExtension.endsWith('.jpg') || logoExtension.endsWith('.jpeg')) {
                logoImage = await pdfDoc.embedJpg(logoBytes);
            } else {
                throw new BadRequestException('Logo must be PNG or JPG format');
            }

            // Clear the old logo area by drawing a white rectangle
            // PDF coordinates start from bottom-left, so we need to convert Y coordinate
            const pdfY = pageHeight - dto.y - dto.height;

            page.drawRectangle({
                x: dto.x,
                y: pdfY,
                width: dto.width,
                height: dto.height,
                color: rgb(1, 1, 1), // White color to cover old logo
            });

            // Calculate logo dimensions maintaining aspect ratio
            const logoAspectRatio = logoImage.width / logoImage.height;
            const targetAspectRatio = dto.width / dto.height;

            let drawWidth = dto.width;
            let drawHeight = dto.height;

            if (logoAspectRatio > targetAspectRatio) {
                // Logo is wider than target area
                drawHeight = dto.width / logoAspectRatio;
            } else {
                // Logo is taller than target area
                drawWidth = dto.height * logoAspectRatio;
            }

            // Center the logo in the target area
            const offsetX = (dto.width - drawWidth) / 2;
            const offsetY = (dto.height - drawHeight) / 2;

            // Draw the new logo
            page.drawImage(logoImage, {
                x: dto.x + offsetX,
                y: pdfY + offsetY,
                width: drawWidth,
                height: drawHeight,
            });

            // Save the modified PDF
            const modifiedPdfBytes = await pdfDoc.save({
                useObjectStreams: false, // Better compatibility
                addDefaultPage: false,
            });

            // Store processed PDF
            const processedFileId = await this.fileStorageService.saveProcessedPdf(
                modifiedPdfBytes,
            );

            this.logger.log(`Logo replacement completed: ${processedFileId}`);
            return processedFileId;
        } catch (error) {
            this.logger.error('Error during logo replacement', error);
            throw error;
        }
    }

    /**
     * Get PDF metadata
     */
    async getPdfMetadata(fileId: string): Promise<{
        pageCount: number;
        title?: string;
        author?: string;
    }> {
        try {
            const pdfPath = this.fileStorageService.getFilePath(fileId);
            const pdfBytes = await this.fileStorageService.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(pdfBytes);

            return {
                pageCount: pdfDoc.getPageCount(),
                title: pdfDoc.getTitle(),
                author: pdfDoc.getAuthor(),
            };
        } catch (error) {
            this.logger.error('Error reading PDF metadata', error);
            throw new BadRequestException('Failed to read PDF metadata');
        }
    }
}
