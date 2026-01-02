import { Module } from '@nestjs/common';
import { NumerotationsModule } from '../numerotations/numerotations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturesService } from './factures.service';
import { FacturesController } from './factures.controller';
import { Facture } from '../entities/facture.entity';
import { Commande } from '../entities/commande.entity';
import { BonDeVersement } from '../entities/bon-de-versement.entity';
import { BonDeRemboursement } from '../entities/bon-de-remboursement.entity';
import { Client } from '../entities/client.entity';
import { Caisse } from '../entities/caisse.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { Numerotation } from '../entities/numerotation.entity';
import { CaisseTransaction } from '../entities/caisse-transaction.entity';
import { CaisseTransactionsModule } from '../caisse-transactions/caisse-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Facture, Commande, Client, Caisse, InfoAgence, Numerotation, BonDeVersement, BonDeRemboursement, CaisseTransaction]),
    CaisseTransactionsModule,
    NumerotationsModule,
  ],
  controllers: [FacturesController],
  providers: [FacturesService],
  exports: [FacturesService],
})
export class FacturesModule { }

