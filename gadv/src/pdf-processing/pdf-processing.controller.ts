import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    Res,
    BadRequestException,
    UseGuards,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfProcessingService } from './pdf-processing.service';
import { FileStorageService } from './file-storage.service';
import { ReplaceLogoDto } from './dto/replace-logo.dto';
import { UploadResponseDto, ProcessingStatusDto } from './dto/response.dto';
@Controller('pdf-processing')
@UseGuards(JwtAuthGuard)
export class PdfProcessingController {
    private readonly logger = new Logger(PdfProcessingController.name);

    constructor(
        private readonly pdfProcessingService: PdfProcessingService,
        private readonly fileStorageService: FileStorageService,
    ) { }

    @Post('upload-pdf')
    @UseInterceptors(FileInterceptor('file'))
    async uploadPdf(
        @UploadedFile() file: Express.Multer.File,
    ): Promise<UploadResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestException('File must be a PDF');
        }

        if (file.size > 20 * 1024 * 1024) {
            throw new BadRequestException('File size must not exceed 20MB');
        }

        const fileId = await this.fileStorageService.saveFile(file, 'pdf');
        const fileInfo = await this.fileStorageService.getFileInfo(fileId);

        this.logger.log(`PDF uploaded: ${fileId}`);

        return {
            fileId,
            filename: file.originalname,
            size: fileInfo.size,
            uploadedAt: new Date().toISOString(),
        };
    }

    @Post('upload-logo')
    @UseInterceptors(FileInterceptor('file'))
    async uploadLogo(
        @UploadedFile() file: Express.Multer.File,
    ): Promise<UploadResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('File must be PNG or JPG');
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('File size must not exceed 5MB');
        }

        const fileId = await this.fileStorageService.saveFile(file, 'logo');
        const fileInfo = await this.fileStorageService.getFileInfo(fileId);

        this.logger.log(`Logo uploaded: ${fileId}`);

        return {
            fileId,
            filename: file.originalname,
            size: fileInfo.size,
            uploadedAt: new Date().toISOString(),
        };
    }

    @Post('replace-logo')
    async replaceLogo(
        @Body() dto: ReplaceLogoDto,
    ): Promise<ProcessingStatusDto> {
        try {
            this.logger.log('Processing logo replacement request');

            const processedFileId = await this.pdfProcessingService.replaceLogo(dto);

            return {
                status: 'completed',
                message: 'Logo replaced successfully',
                downloadUrl: `/api/pdf-processing/download/${processedFileId}`,
            };
        } catch (error) {
            this.logger.error('Logo replacement failed', error);
            return {
                status: 'failed',
                message: error.message || 'An error occurred during processing',
            };
        }
    }

    @Get('download/:fileId')
    async downloadPdf(
        @Param('fileId') fileId: string,
        @Res() res: Response,
    ): Promise<void> {
        try {
            const filepath = this.fileStorageService.getFilePath(fileId, 'processed');
            const fileBuffer = await this.fileStorageService.readFile(filepath);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="modified-document.pdf"`,
                'Content-Length': fileBuffer.length,
            });

            res.send(fileBuffer);
            this.logger.log(`PDF downloaded: ${fileId}`);
        } catch (error) {
            this.logger.error('Download failed', error);
            throw new BadRequestException('File not found');
        }
    }
}
