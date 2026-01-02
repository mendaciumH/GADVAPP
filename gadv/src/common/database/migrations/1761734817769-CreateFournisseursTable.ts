import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFournisseursTable1761734817769 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create fournisseurs table
    await queryRunner.query(`
      CREATE TABLE "fournisseurs" (
        "id" BIGSERIAL NOT NULL,
        "nom_complet" text NOT NULL,
        "numero_mobile" text,
        "notes" text,
        "credit_depart" numeric(10,2),
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
      )
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('fournisseurs_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "fournisseurs"`);
  }
}

