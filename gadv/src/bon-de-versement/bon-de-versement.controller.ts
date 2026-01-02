import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { BonDeVersementService } from './bon-de-versement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateBonDeVersementDto } from './dto/create-bon-de-versement.dto';
import { UpdateBonDeVersementDto } from './dto/update-bon-de-versement.dto';

@Controller('admin/bon-de-versement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_bon_de_versement', 'manage_bon_de_versement')
export class BonDeVersementController {
  constructor(private readonly bonDeVersementService: BonDeVersementService) { }

  @Get()
  async findAll() {
    return this.bonDeVersementService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bonDeVersementService.findOne(id);
  }

  @Get('commande/:commandeId')
  async findByCommandeId(@Param('commandeId', ParseIntPipe) commandeId: number) {
    return this.bonDeVersementService.findByCommandeId(commandeId);
  }

  @Get('client/:clientId')
  async findByClientId(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.bonDeVersementService.findByClientId(clientId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createBonDeVersementDto: CreateBonDeVersementDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.bonDeVersementService.create(createBonDeVersementDto, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBonDeVersementDto: UpdateBonDeVersementDto,
    @Req() req: any,
  ) {
    return this.bonDeVersementService.update(id, updateBonDeVersementDto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.bonDeVersementService.remove(id);
  }

  @Get(':id/print')
  async printPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    await this.bonDeVersementService.generatePdf(id, res);
  }
}

