import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';


import { AppDataSource } from './common/database/data-source';



import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { InfoAgenceModule } from './info-agence/info-agence.module';
import { ClientsModule } from './clients/clients.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { TypeArticleModule } from './type-article/type-article.module';
import { ArticlesModule } from './articles/articles.module';
import { CompagniesAeriennesModule } from './compagnies-aeriennes/compagnies-aeriennes.module';
import { CommandesModule } from './commandes/commandes.module';
import { SessionsModule } from './sessions/sessions.module';
import { FacturesModule } from './factures/factures.module';
import { ReductionsModule } from './reductions/reductions.module';
import { TaxesModule } from './taxes/taxes.module';
import { BonDeVersementModule } from './bon-de-versement/bon-de-versement.module';
import { BonDeRemboursementModule } from './bon-de-remboursement/bon-de-remboursement.module';
import { CaissesModule } from './caisses/caisses.module';
import { NumerotationsModule } from './numerotations/numerotations.module';
import { CaisseTransactionsModule } from './caisse-transactions/caisse-transactions.module';
import { PdfProcessingModule } from './pdf-processing/pdf-processing.module';
import { ContactController } from './contact.controller';
import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  test() {
    return { message: 'Test controller is working' };
  }
}

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString()
    };
  }
}

@Controller('db-test')
export class DbTestController {
  @Get()
  async dbTest() {
    try {
      // Test database connection
      const dataSource = AppDataSource;
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      // Test a simple query
      const result = await dataSource.query('SELECT 1 as test');

      return {
        status: 'success',
        database: 'connected',
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(AppDataSource.options),


    CommonModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    InfoAgenceModule,
    ClientsModule,
    FournisseursModule,
    TypeArticleModule,
    ArticlesModule,
    CompagniesAeriennesModule,
    CommandesModule,
    SessionsModule,
    FacturesModule,
    ReductionsModule,
    TaxesModule,
    BonDeVersementModule,
    BonDeRemboursementModule,
    CaissesModule,
    NumerotationsModule,
    CaisseTransactionsModule,
    PdfProcessingModule,
  ],
  controllers: [ContactController, TestController, HealthController, DbTestController],
})
export class AppModule { }
