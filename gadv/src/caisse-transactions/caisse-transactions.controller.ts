import { Controller, Get, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { CaisseTransactionsService } from './caisse-transactions.service';
import { TransactionType } from '../entities/caisse-transaction.entity';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('admin/caisse-transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CaisseTransactionsController {
    constructor(private readonly caisseTransactionsService: CaisseTransactionsService) { }

    @Get()
    findAll(
        @Request() req,
        @Query('caisseId') caisseId?: number,
        @Query('type') type?: TransactionType,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        return this.caisseTransactionsService.findAll({
            caisseId,
            type,
            dateFrom,
            dateTo,
        }, req.user);
    }

    @Get('omra')
    @Permissions('view_caisse_omra')
    findOmraTransactions() {
        return this.caisseTransactionsService.findOmraTransactions();
    }

    @Get('caisse/:caisseId')
    findByCaisseId(@Param('caisseId', ParseIntPipe) caisseId: number) {
        return this.caisseTransactionsService.findByCaisseId(caisseId);
    }
}
