import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PdfProcessingController } from './pdf-processing.controller';
import { PdfProcessingService } from './pdf-processing.service';
import { FileStorageService } from './file-storage.service';

@Module({
    imports: [
        MulterModule.register({
            storage: require('multer').memoryStorage(),
            limits: {
                fileSize: 20 * 1024 * 1024, // 20MB max
            },
        }),
    ],
    controllers: [PdfProcessingController],
    providers: [PdfProcessingService, FileStorageService],
    exports: [PdfProcessingService, FileStorageService],
})
export class PdfProcessingModule { }
