import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileStorageService {
    private readonly logger = new Logger(FileStorageService.name);
    private readonly uploadDir = join(process.cwd(), 'uploads', 'pdf-processing');
    private readonly tempDir = join(this.uploadDir, 'temp');
    private readonly processedDir = join(this.uploadDir, 'processed');

    constructor() {
        this.ensureDirectoriesExist();
    }

    /**
     * Ensure upload directories exist
     */
    private async ensureDirectoriesExist(): Promise<void> {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            await fs.mkdir(this.tempDir, { recursive: true });
            await fs.mkdir(this.processedDir, { recursive: true });
            this.logger.log('Upload directories initialized');
        } catch (error) {
            this.logger.error('Failed to create upload directories', error);
        }
    }

    /**
     * Save uploaded file with unique ID
     */
    async saveFile(file: Express.Multer.File, type: 'pdf' | 'logo'): Promise<string> {
        const fileId = `${type}_${uuidv4()}`;
        const extension = file.originalname.split('.').pop();
        const filename = `${fileId}.${extension}`;
        const filepath = join(this.tempDir, filename);

        await fs.writeFile(filepath, file.buffer);
        this.logger.log(`File saved: ${filename}`);

        return fileId;
    }

    /**
     * Get file path by ID
     */
    getFilePath(fileId: string, directory: 'temp' | 'processed' = 'temp'): string {
        const dir = directory === 'temp' ? this.tempDir : this.processedDir;

        // Find file with matching ID (regardless of extension)
        const files = require('fs').readdirSync(dir);
        const matchingFile = files.find((f: string) => f.startsWith(fileId));

        if (!matchingFile) {
            throw new Error(`File not found: ${fileId}`);
        }

        return join(dir, matchingFile);
    }

    /**
     * Save processed PDF
     */
    async saveProcessedPdf(pdfBytes: Uint8Array): Promise<string> {
        const fileId = `processed_${uuidv4()}`;
        const filename = `${fileId}.pdf`;
        const filepath = join(this.processedDir, filename);

        await fs.writeFile(filepath, pdfBytes);
        this.logger.log(`Processed PDF saved: ${filename}`);

        return fileId;
    }

    /**
     * Read file as buffer
     */
    async readFile(filepath: string): Promise<Buffer> {
        return fs.readFile(filepath);
    }

    /**
     * Clean up old files (older than 24 hours)
     */
    async cleanupOldFiles(): Promise<void> {
        try {
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            for (const dir of [this.tempDir, this.processedDir]) {
                const files = await fs.readdir(dir);

                for (const file of files) {
                    const filepath = join(dir, file);
                    const stats = await fs.stat(filepath);

                    if (now - stats.mtimeMs > maxAge) {
                        await fs.unlink(filepath);
                        this.logger.log(`Cleaned up old file: ${file}`);
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error during file cleanup', error);
        }
    }

    /**
     * Get file info
     */
    async getFileInfo(fileId: string): Promise<{ size: number; filename: string }> {
        const filepath = this.getFilePath(fileId);
        const stats = await fs.stat(filepath);
        const filename = filepath.split(/[\\/]/).pop() || fileId;

        return {
            size: stats.size,
            filename,
        };
    }
}
