import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCaissesTable1761734817770 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create caisses table
    await queryRunner.query(`
      CREATE TABLE if not exists "caisses" (
        "id" BIGSERIAL NOT NULL,
        "nom_caisse" text NOT NULL,
        "montant_depart" numeric(10,2),
        "devise" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "caisses_pkey" PRIMARY KEY ("id")
      )
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('caisses_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "caisses"`);
  }
}

