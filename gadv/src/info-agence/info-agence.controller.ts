import {
  Controller,
  Get,
  Post,
  Put,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InfoAgenceService } from './info-agence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateInfoAgenceDto } from './dto/create-info-agence.dto';
import { UpdateInfoAgenceDto } from './dto/update-info-agence.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { createLogoMulterConfig } from '../common/config/file-upload.config';
import { FileUrlHelper } from '../common/utils/file-url.helper';

@Controller('admin/info-agence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InfoAgenceController {
  constructor(private readonly infoAgenceService: InfoAgenceService) { }

  @Get()
  async findAll() {
    return this.infoAgenceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.infoAgenceService.findOne(id);
  }

  @Post('upload-logo')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('logo', createLogoMulterConfig()))
  async uploadLogo(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Aucun fichier téléchargé');
    }

    const fileUrl = FileUrlHelper.generateFileUrl(file.filename, process.env.BASE_URL);

    return {
      url: fileUrl,
      filename: file.filename,
    };
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createInfoAgenceDto: CreateInfoAgenceDto) {
    return this.infoAgenceService.create(createInfoAgenceDto);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInfoAgenceDto: UpdateInfoAgenceDto,
  ) {
    return this.infoAgenceService.update(id, updateInfoAgenceDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.infoAgenceService.remove(id);
  }
}

