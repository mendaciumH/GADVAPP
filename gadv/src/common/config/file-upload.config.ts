import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

// File upload configuration constants
export const FILE_UPLOAD_CONFIG = {
  LOGO: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: /\/(jpg|jpeg|png|gif|webp)$/,
    DESTINATION: join(process.cwd(), 'uploads'),
    PREFIX: 'logo',
  },
};

/**
 * Creates Multer configuration for logo uploads
 * @returns MulterOptions configuration object
 */
export function createLogoMulterConfig(): MulterOptions {
  return {
    storage: diskStorage({
      destination: FILE_UPLOAD_CONFIG.LOGO.DESTINATION,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${FILE_UPLOAD_CONFIG.LOGO.PREFIX}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(FILE_UPLOAD_CONFIG.LOGO.ALLOWED_MIME_TYPES)) {
        return cb(
          new BadRequestException('Seuls les fichiers image (jpg, jpeg, png, gif, webp) sont autorisés'),
          false,
        );
      }
      cb(null, true);
    },
    limits: {
      fileSize: FILE_UPLOAD_CONFIG.LOGO.MAX_SIZE,
    },
  };
}

