import { DataSource } from 'typeorm';

// Import entities
import { Role } from '../../../entities/role.entity';
import { Permission } from '../../../entities/permission.entity';
import { RolePermission } from '../../../entities/role-permission.entity';
import { TypeArticle } from '../../../entities/type-article.entity';
import { User } from '../../../entities/user.entity';
import { Fournisseur } from '../../../entities/fournisseur.entity';
import { Caisse } from '../../../entities/caisse.entity';
import { Client } from '../../../entities/client.entity';
import { Article } from '../../../entities/article.entity';
import { Commande } from '../../../entities/commande.entity';
import { Reduction } from '../../../entities/reduction.entity';
import { Taxe } from '../../../entities/taxe.entity';
import { InfoAgence } from '../../../entities/info-agence.entity';
import { CompagnieAerienne } from '../../../entities/compagnie-aerienne.entity';
import { Facture } from '../../../entities/facture.entity';
import { BonDeVersement } from '../../../entities/bon-de-versement.entity';
import { BonDeRemboursement } from '../../../entities/bon-de-remboursement.entity';
import { ArticleOmra } from '../../../entities/article-omra.entity';
import { ArticleVisa } from '../../../entities/article-visa.entity';
import { ArticleVoyage } from '../../../entities/article-voyage.entity';
import { ArticleAssurance } from '../../../entities/article-assurance.entity';
import { ArticleBilletAvion } from '../../../entities/article-billet-avion.entity';
import { ArticleReservationHotel } from '../../../entities/article-reservation-hotel.entity';
import { Chambre } from '../../../entities/chambre.entity';
import { Session } from '../../../entities/session.entity';
import { Numerotation } from '../../../entities/numerotation.entity';
import { CaisseTransaction } from '../../../entities/caisse-transaction.entity';

// Import migrations
import { CreateRolesTable1761734817764 } from '../migrations/1761734817764-CreateRolesTable';
import { CreatePermissionsTable1761734817765 } from '../migrations/1761734817765-CreatePermissionsTable';
import { CreateRolePermissionsTable1761734817766 } from '../migrations/1761734817766-CreateRolePermissionsTable';
import { CreateTypeArticleTable1761734817767 } from '../migrations/1761734817767-CreateTypeArticleTable';
import { CreateUsersTable1761734817768 } from '../migrations/1761734817768-CreateUsersTable';
import { CreateFournisseursTable1761734817769 } from '../migrations/1761734817769-CreateFournisseursTable';
import { CreateCaissesTable1761734817770 } from '../migrations/1761734817770-CreateCaissesTable';
import { CreateClientsTable1761734817771 } from '../migrations/1761734817771-CreateClientsTable';
import { CreateArticlesTable1761734817772 } from '../migrations/1761734817772-CreateArticlesTable';
import { CreateCommandesTable1761734817773 } from '../migrations/1761734817773-CreateCommandesTable';
import { CreateReductionsTable1761734817774 } from '../migrations/1761734817774-CreateReductionsTable';
import { CreateTaxesTable1761734817775 } from '../migrations/1761734817775-CreateTaxesTable';
import { CreateInfoAgenceTable1761734817776 } from '../migrations/1761734817776-CreateInfoAgenceTable';
import { CreateCompagniesAeriennesTable1762349500000 } from '../migrations/1762349500000-CreateCompagniesAeriennesTable';
import { UpdateCompagnieAerienneToId1762349600000 } from '../migrations/1762349600000-UpdateCompagnieAerienneToId';
import { CreateFacturesTable1762400000000 } from '../migrations/1762400000000-CreateFacturesTable';
import { CreateBonDeVersementTable1762500000000 } from '../migrations/1762500000000-CreateBonDeVersementTable';
import { CreateArticleSpecificTables1762600000000 } from '../migrations/1762600000000-CreateArticleSpecificTables';
import { RemoveCompagnieFromArticles1764600000000 } from '../migrations/1764600000000-RemoveCompagnieFromArticles';
import { CreateChambresTable1764600200000 } from '../migrations/1764600200000-CreateChambresTable';
import { AddUniqueConstraintToPermissions1764700000000 } from '../migrations/1764700000000-AddUniqueConstraintToPermissions';
import { AddPaymentFieldsToBonDeVersement1764800000000 } from '../migrations/1764800000000-AddPaymentFieldsToBonDeVersement';
import { AddCaisseSoldeAndPrincipale1764900000000 } from '../migrations/1764900000000-AddCaisseSoldeAndPrincipale';
import { AddOmraArticleFields1765000000000 } from '../migrations/1765000000000-AddOmraArticleFields';
import { AddMoreCompagniesAeriennes1765100000000 } from '../migrations/1765100000000-AddMoreCompagniesAeriennes';
import { CreateSessionsTable1765300000000 } from '../migrations/1765300000000-CreateSessionsTable';
import { RemoveDateFromOmraAndDisponibiliteFromArticles1765400000000 } from '../migrations/1765400000000-RemoveDateFromOmraAndDisponibiliteFromArticles';

import { AddTarifAdditionnelToArticleOmra1765600000000 } from '../migrations/1765600000000-AddTarifAdditionnelToArticleOmra';
import { CreateNumerotationsTable1765700000000 } from '../migrations/1765700000000-CreateNumerotationsTable';

import { CreateBonDeRemboursementTable1762600100000 } from '../migrations/1762600100000-CreateBonDeRemboursementTable';
import { CreateCaisseTransactionsTable1765800000000 } from '../migrations/1765800000000-CreateCaisseTransactionsTable';

// Temporarily disabled - causing migration issues, sync logic handled in application code
// import { SyncFactureOnCommandeUpdate1766000000000 } from '../migrations/1766000000000-SyncFactureOnCommandeUpdate';
import { AutoAssignPermissions1766007143000 } from '../migrations/1766007143000-AutoAssignPermissions';
import { AddUserIdToTables1766007400000 } from '../migrations/1766007400000-AddUserIdToTables';
import { FixMissingPermissions1766007600000 } from '../migrations/1766007600000-FixMissingPermissions';
import { AddOmraPermissions1766008000000 } from '../migrations/1766008000000-AddOmraPermissions';
import { AddModeReglementToFactures1766008100000 } from '../migrations/1766008100000-AddModeReglementToFactures';
import { AddEtatCreancesPermissions1766009000000 } from '../migrations/1766009000000-AddEtatCreancesPermissions';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'hb,',
  database: process.env.DB_DATABASE || 'gadv_db',
  entities: [
    Role,
    Permission,
    RolePermission,
    TypeArticle,
    User,
    Fournisseur,
    Caisse,
    Client,
    Article,
    Commande,
    Reduction,
    Taxe,
    InfoAgence,
    CompagnieAerienne,
    Facture,
    BonDeVersement,
    BonDeRemboursement,
    ArticleOmra,
    ArticleVisa,
    ArticleVoyage,
    ArticleAssurance,
    ArticleBilletAvion,
    ArticleReservationHotel,
    Chambre,
    Session,
    Numerotation,
    CaisseTransaction,
  ],
  migrationsTableName: 'migrations',
  migrations: [
    CreateRolesTable1761734817764,
    CreatePermissionsTable1761734817765,
    CreateRolePermissionsTable1761734817766,
    CreateTypeArticleTable1761734817767,
    CreateUsersTable1761734817768,
    CreateFournisseursTable1761734817769,
    CreateCaissesTable1761734817770,
    CreateClientsTable1761734817771,
    CreateArticlesTable1761734817772,
    CreateCommandesTable1761734817773,
    CreateReductionsTable1761734817774,
    CreateTaxesTable1761734817775,
    CreateInfoAgenceTable1761734817776,
    CreateCompagniesAeriennesTable1762349500000,
    UpdateCompagnieAerienneToId1762349600000,
    CreateFacturesTable1762400000000,
    CreateBonDeVersementTable1762500000000,
    CreateArticleSpecificTables1762600000000,
    CreateBonDeRemboursementTable1762600100000,
    RemoveCompagnieFromArticles1764600000000,
    CreateChambresTable1764600200000,
    AddUniqueConstraintToPermissions1764700000000,
    AddPaymentFieldsToBonDeVersement1764800000000,
    AddCaisseSoldeAndPrincipale1764900000000,
    AddOmraArticleFields1765000000000,
    AddMoreCompagniesAeriennes1765100000000,
    CreateSessionsTable1765300000000,
    RemoveDateFromOmraAndDisponibiliteFromArticles1765400000000,
    AddTarifAdditionnelToArticleOmra1765600000000,
    CreateNumerotationsTable1765700000000,
    CreateCaisseTransactionsTable1765800000000,
    // SyncFactureOnCommandeUpdate1766000000000, // Disabled - causing issues
    AutoAssignPermissions1766007143000,
    AddUserIdToTables1766007400000,
    FixMissingPermissions1766007600000,
    AddOmraPermissions1766008000000,
    AddModeReglementToFactures1766008100000,
    AddEtatCreancesPermissions1766009000000,
  ],
  migrationsRun: false,
  synchronize: false,//avoid suncronize true in production
  logging: true,
});
