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
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FournisseursService } from './fournisseurs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';

@Controller('admin/fournisseurs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_fournisseurs', 'manage_fournisseurs')
export class FournisseursController {
  constructor(private readonly fournisseursService: FournisseursService) { }

  @Get()
  async findAll() {
    return this.fournisseursService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fournisseursService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFournisseurDto: CreateFournisseurDto, @Req() req) {
    return this.fournisseursService.create(createFournisseurDto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFournisseurDto: UpdateFournisseurDto,
  ) {
    return this.fournisseursService.update(id, updateFournisseurDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.fournisseursService.remove(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('Fichier Excel requis');
    }

    if (!file.mimetype.includes('spreadsheet') && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
      throw new BadRequestException('Le fichier doit être un fichier Excel (.xlsx ou .xls)');
    }

    const result = await this.fournisseursService.importFromExcel(file, req.user);
    return result;
  }
}

