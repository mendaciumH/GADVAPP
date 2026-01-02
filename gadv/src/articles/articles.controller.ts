import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { UploadResponseDto } from './dto/upload-response.dto';

@Controller('admin/articles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_articles', 'manage_articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) { }

  @Get()
  @Permissions('view_articles', 'manage_articles', 'view_omra', 'manage_omra')
  async findAll(@Req() req) {
    return this.articlesService.findAll(req.user);
  }

  @Get('tourisme')
  @Permissions('view_articles', 'manage_articles')
  async findAllServiceTourisme(@Req() req) {
    return this.articlesService.findAllServiceTourisme(req.user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createArticleDto: CreateArticleDto, @Req() req) {
    return this.articlesService.create(createArticleDto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req,
  ) {
    return this.articlesService.update(id, updateArticleDto, req.user);
  }

  @Patch(':id')
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.articlesService.remove(id);
  }

  @Post('upload-banner')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `banner-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        console.log('🔍 File filter check:', {
          mimetype: file.mimetype,
          originalname: file.originalname,
          size: file.size
        });

        if (!file.mimetype) {
          console.error('❌ No mimetype provided');
          return cb(new BadRequestException('File type could not be determined'), false);
        }

        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/i)) {
          console.error('❌ Invalid file type:', file.mimetype);
          return cb(new BadRequestException(`File type not allowed: ${file.mimetype}. Only JPG, PNG, GIF, and WEBP are allowed.`), false);
        }

        console.log('✅ File type validated');
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadBanner(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    try {
      console.log('📥 Upload endpoint called, file received:', file ? 'Yes' : 'No');

      if (!file) {
        console.error('❌ No file in request');
        throw new BadRequestException('No file uploaded. Please select an image file.');
      }

      console.log('📥 Banner upload received:', {
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        destination: file.destination,
        path: file.path
      });

      // Verify file was saved - use file.path (full path from multer) or construct it
      const filePath = file.path || join(file.destination || join(process.cwd(), 'uploads'), file.filename);

      if (!existsSync(filePath)) {
        console.error('❌ File was not saved to disk:', filePath);
        console.error('Expected path:', filePath);
        console.error('File object:', JSON.stringify(file, null, 2));
        throw new BadRequestException('File upload failed: file was not saved to disk');
      }

      console.log('✅ File saved successfully:', filePath);

      const isProduction = process.env.NODE_ENV === 'production';
      const uploadsPrefix = isProduction ? '/api/uploads/' : '/uploads/';
      const fileUrl = `${uploadsPrefix}${file.filename}`;

      return { url: fileUrl, filename: file.filename };
    } catch (error: any) {
      console.error('❌ Upload error:', {
        message: error.message,
        name: error.name,
        status: error.status,
        response: error.response
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        throw new BadRequestException('File too large. Maximum size is 5MB.');
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        throw new BadRequestException('Unexpected file field. Please use the "banner" field name.');
      }

      throw new BadRequestException(error.message || 'File upload failed');
    }
  }
}

