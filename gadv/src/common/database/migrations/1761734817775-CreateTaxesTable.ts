import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaxesTable1761734817775 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create taxes table
    await queryRunner.query(`
      CREATE TABLE "taxes" (
        "id" BIGSERIAL NOT NULL,
        "id_type_article" bigint,
        "reference" text,
        "taxe_fixe" boolean,
        "montant_taxe_fixe" numeric(10,2),
        "taxe_pourcentage" numeric(5,2),
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key
    await queryRunner.query(`
      ALTER TABLE "taxes" 
      ADD CONSTRAINT "taxes_id_type_article_fkey" 
      FOREIGN KEY ("id_type_article") REFERENCES "type_article"("id")
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('taxes_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "taxes" DROP CONSTRAINT IF EXISTS "taxes_id_type_article_fkey"`);
    await queryRunner.query(`DROP TABLE "taxes"`);
  }
}

