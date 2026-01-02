import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFacturesTable1762400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create factures table
    await queryRunner.query(`
      CREATE TABLE "factures" (
        "id" BIGSERIAL NOT NULL,
        "commande_id" bigint NOT NULL,
        "numero_facture" text NOT NULL UNIQUE,
        "date_facture" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "date_echeance" date,
        "montant_ht" numeric(10,2) NOT NULL DEFAULT 0,
        "montant_tva" numeric(10,2) NOT NULL DEFAULT 0,
        "montant_ttc" numeric(10,2) NOT NULL DEFAULT 0,
        "reductions" numeric(10,2) DEFAULT 0,
        "autre_reductions" numeric(10,2) DEFAULT 0,
        "taxes" numeric(10,2) DEFAULT 0,
        "statut" text NOT NULL DEFAULT 'en_attente',
        "notes" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "factures_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "factures_statut_check" CHECK (("statut" = ANY (ARRAY['en_attente'::text, 'payee'::text, 'annulee'::text, 'impayee'::text])))
      )
    `);

    // Create foreign key
    await queryRunner.query(`
      ALTER TABLE "factures" 
      ADD CONSTRAINT "factures_commande_id_fkey" 
      FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE
    `);

    // Create index on numero_facture for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_factures_numero_facture" ON "factures" ("numero_facture")
    `);

    // Create index on commande_id
    await queryRunner.query(`
      CREATE INDEX "idx_factures_commande_id" ON "factures" ("commande_id")
    `);

    // Create index on statut
    await queryRunner.query(`
      CREATE INDEX "idx_factures_statut" ON "factures" ("statut")
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('factures_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_factures_statut"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_factures_commande_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_factures_numero_facture"`);
    await queryRunner.query(`ALTER TABLE "factures" DROP CONSTRAINT IF EXISTS "factures_commande_id_fkey"`);
    await queryRunner.query(`DROP TABLE "factures"`);
  }
}

