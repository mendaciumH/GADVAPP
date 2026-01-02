import { Module } from '@nestjs/common';
import { NumerotationsModule } from '../numerotations/numerotations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonDeVersementService } from './bon-de-versement.service';
import { BonDeVersementController } from './bon-de-versement.controller';
import { BonDeVersement } from '../entities/bon-de-versement.entity';
import { Client } from '../entities/client.entity';
import { Commande } from '../entities/commande.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { Facture } from '../entities/facture.entity';
import { Caisse } from '../entities/caisse.entity';
import { CaisseTransactionsModule } from '../caisse-transactions/caisse-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BonDeVersement, Client, Commande, InfoAgence, Facture, Caisse]),
    CaisseTransactionsModule,
    NumerotationsModule,
  ],
  controllers: [BonDeVersementController],
  providers: [BonDeVersementService],
  exports: [BonDeVersementService],
})
export class BonDeVersementModule { }

