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
  Res,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { CommandesService } from './commandes.service';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { UpdateCommandeDto } from './dto/update-commande.dto';

@Controller('admin/commandes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_commandes', 'manage_commandes')
export class CommandesController {
  constructor(
    private readonly commandesService: CommandesService,
    private readonly pdfService: PdfService,
  ) { }

  @Get('tourisme')
  @Permissions('view_commandes', 'manage_commandes')
  async findAllTourisme(@Request() req) {
    return this.commandesService.findAllTourisme(req.user);
  }

  @Get('omra')
  @Permissions('view_omra', 'manage_omra', 'view_commandes', 'manage_commandes')
  async findAllOmra(@Request() req) {
    return this.commandesService.findAllOmra(req.user);
  }

  // Override create/update/delete for Omra specific checks if needed
  // For now, we reuse the generic create/update but we might want to check article type 
  // However, since the payload comes in body, we can't easily distinguish at route level without custom guard or check inside service/controller

  @Post('omra')
  @Permissions('manage_omra', 'manage_commandes')
  @HttpCode(HttpStatus.CREATED)
  async createOmra(@Body() createCommandeDto: CreateCommandeDto, @Request() req) {
    // We should validate here that the article is indeed Omra type=1
    // But for now we trust the caller or Service validation. 
    // Ideally we force fetching article to check type.
    return this.commandesService.create(createCommandeDto, req.user);
  }

  @Put('omra/:id')
  @Permissions('manage_omra', 'manage_commandes')
  async updateOmra(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommandeDto: UpdateCommandeDto,
    @Request() req,
  ) {
    return this.commandesService.update(id, updateCommandeDto, req.user);
  }

  @Get()
  @Permissions('view_commandes', 'manage_commandes', 'view_omra', 'manage_omra')
  async findAll(@Request() req) {
    return this.commandesService.findAll(req.user);
  }



  @Get(':id/print-contract')
  async printContract(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    await this.pdfService.generateTravelContract(id, res);
  }

  @Get(':id/bon-de-commande')
  async generateBonDeCommande(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    await this.pdfService.generateBonDeCommande(id, res);
  }

  @Get(':id/details')
  async findOneWithDetails(@Param('id', ParseIntPipe) id: number) {
    return this.commandesService.findOneWithDetails(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commandesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCommandeDto: CreateCommandeDto, @Request() req) {
    return this.commandesService.create(createCommandeDto, req.user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelCommande(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.commandesService.cancelCommande(id, req.user?.id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommandeDto: UpdateCommandeDto,
    @Request() req,
  ) {
    return this.commandesService.update(id, updateCommandeDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.commandesService.remove(id);
  }
}

