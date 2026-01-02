import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandesController } from './commandes.controller';
import { CommandesService } from './commandes.service';
import { PdfService } from './pdf.service';
import { Commande } from '../entities/commande.entity';
import { Article } from '../entities/article.entity';
import { Session } from '../entities/session.entity';
import { InfoAgence } from '../entities/info-agence.entity';
import { Facture } from '../entities/facture.entity';
import { BonDeVersement } from '../entities/bon-de-versement.entity';
import { FacturesModule } from '../factures/factures.module';
import { SessionsModule } from '../sessions/sessions.module';
import { NumerotationsModule } from '../numerotations/numerotations.module';
import { BonDeRemboursementModule } from '../bon-de-remboursement/bon-de-remboursement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commande, Article, Session, InfoAgence, Facture, BonDeVersement]),
    forwardRef(() => FacturesModule),
    forwardRef(() => SessionsModule),
    NumerotationsModule,
    forwardRef(() => BonDeRemboursementModule),
  ],
  controllers: [CommandesController],
  providers: [CommandesService, PdfService],
  exports: [CommandesService],
})
export class CommandesModule { }

