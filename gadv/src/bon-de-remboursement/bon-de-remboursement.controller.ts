import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, Res, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { BonDeRemboursementService } from './bon-de-remboursement.service';
import { CreateBonDeRemboursementDto } from './dto/create-bon-de-remboursement.dto';
import { UpdateBonDeRemboursementDto } from './dto/update-bon-de-remboursement.dto';

@Controller('admin/bon-de-remboursement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('view_bon_de_remboursement', 'manage_bon_de_remboursement')
export class BonDeRemboursementController {
    constructor(private readonly bonDeRemboursementService: BonDeRemboursementService) { }

    @Get()
    findAll() {
        return this.bonDeRemboursementService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.bonDeRemboursementService.findOne(id);
    }

    @Get('commande/:commandeId')
    findByCommandeId(@Param('commandeId', ParseIntPipe) commandeId: number) {
        return this.bonDeRemboursementService.findByCommandeId(commandeId);
    }

    @Get('client/:clientId')
    findByClientId(@Param('clientId', ParseIntPipe) clientId: number) {
        return this.bonDeRemboursementService.findByClientId(clientId);
    }

    @Post()
    create(@Body() createBonDeRemboursementDto: CreateBonDeRemboursementDto, @Req() req: any) {
        return this.bonDeRemboursementService.create(createBonDeRemboursementDto, req.user?.id);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateBonDeRemboursementDto: UpdateBonDeRemboursementDto,
        @Req() req: any,
    ) {
        return this.bonDeRemboursementService.update(id, updateBonDeRemboursementDto, req.user?.id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.bonDeRemboursementService.remove(id);
    }

    @Get(':id/print')
    async printPdf(
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ): Promise<void> {
        await this.bonDeRemboursementService.generatePdf(id, res);
    }
}
