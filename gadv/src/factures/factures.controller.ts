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
import { FacturesService } from './factures.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import { GenerateFactureDto } from './dto/generate-facture.dto';
import { PayFactureDto } from './dto/pay-facture.dto';

@Controller('admin/factures')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_factures', 'manage_factures')
export class FacturesController {
  constructor(private readonly facturesService: FacturesService) { }

  @Get()
  async findAll() {
    return this.facturesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facturesService.findOne(id);
  }

  @Get('commande/:commandeId')
  async findByCommandeId(@Param('commandeId', ParseIntPipe) commandeId: number) {
    return this.facturesService.findByCommandeId(commandeId);
  }

  @Get(':id/payment-info')
  async getPaymentInfo(@Param('id', ParseIntPipe) id: number) {
    return this.facturesService.getPaymentInfo(id);
  }

  @Get(':id/pdf')
  async generatePdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return this.facturesService.generatePdf(id, res);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createFactureDto: CreateFactureDto, @Req() req) {
    return this.facturesService.create(createFactureDto, req.user);
  }

  @Post('generate/:commandeId')
  @HttpCode(HttpStatus.CREATED)
  async generateFromCommande(
    @Param('commandeId', ParseIntPipe) commandeId: number,
    @Body() generateFactureDto: GenerateFactureDto | undefined,
    @Req() req,
  ) {
    return this.facturesService.generateFromCommande(commandeId, generateFactureDto?.notes, req.user);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  async pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() payFactureDto: PayFactureDto,
    @Req() req: any,
  ) {
    // Assuming user is attached to request by auth guard
    const userId = req.user?.id;
    return this.facturesService.payFacture(id, payFactureDto, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelFacture(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.facturesService.cancelFacture(id, req.user?.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFactureDto: UpdateFactureDto,
    @Req() req,
  ) {
    return this.facturesService.update(id, updateFactureDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.facturesService.remove(id);
  }
}

