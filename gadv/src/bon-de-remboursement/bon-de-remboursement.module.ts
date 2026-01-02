import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonDeRemboursementController } from './bon-de-remboursement.controller';
import { BonDeRemboursementService } from './bon-de-remboursement.service';
import { BonDeRemboursement } from '../entities/bon-de-remboursement.entity';
import { Client } from '../entities/client.entity';
import { Commande } from '../entities/commande.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { NumerotationsModule } from '../numerotations/numerotations.module';
import { CaisseTransactionsModule } from '../caisse-transactions/caisse-transactions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BonDeRemboursement, Client, Commande, InfoAgence]),
        NumerotationsModule,
        CaisseTransactionsModule,
    ],
    controllers: [BonDeRemboursementController],
    providers: [BonDeRemboursementService],
    exports: [BonDeRemboursementService],
})
export class BonDeRemboursementModule { }
