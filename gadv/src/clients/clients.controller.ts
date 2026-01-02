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
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('admin/clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_clients', 'manage_clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) { }

  @Get()
  async findAll() {
    return this.clientsService.findAll();
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('manage_clients')
  async importFromExcel(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('Fichier Excel requis');
    }

    if (!file.mimetype.includes('spreadsheet') && !file.originalname.endsWith('.xlsx') && !file.originalname.endsWith('.xls')) {
      throw new BadRequestException('Le fichier doit être un fichier Excel (.xlsx ou .xls)');
    }

    const result = await this.clientsService.importFromExcel(file, req.user);
    return result;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createClientDto: CreateClientDto, @Req() req) {
    return this.clientsService.create(createClientDto, req.user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.clientsService.remove(id);
  }
}

