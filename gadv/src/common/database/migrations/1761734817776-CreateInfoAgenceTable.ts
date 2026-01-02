import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInfoAgenceTable1761734817776 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create info_agence table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "info_agence" (
        "id" BIGSERIAL NOT NULL,
        "nom_agence" text NOT NULL,
        "tel" text,
        "email" text,
        "adresse" text,
        "site_web" text,
        "code_iata" text,
        "logo" text,
        "prefix_factures" text,
        "pied_facture" text,
        "n_licence" text,
        "fax" text,
        "n_rc" text,
        "ar" text,
        "nis" text,
        "nif" text,
        "rib" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "info_agence_pkey" PRIMARY KEY ("id")
      )
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('info_agence_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "info_agence"`);
  }
}

