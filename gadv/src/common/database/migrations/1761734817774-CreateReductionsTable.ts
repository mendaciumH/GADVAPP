import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReductionsTable1761734817774 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reductions table
    await queryRunner.query(`
      CREATE TABLE "reductions" (
        "id" BIGSERIAL NOT NULL,
        "type_article_id" bigint,
        "reference" text,
        "reduction_fixe" boolean,
        "montant_reduction_fixe" numeric(10,2),
        "reduction_pourcentage" numeric(5,2),
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "reductions_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key
    await queryRunner.query(`
      ALTER TABLE "reductions" 
      ADD CONSTRAINT "reductions_type_article_id_fkey" 
      FOREIGN KEY ("type_article_id") REFERENCES "type_article"("id")
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('reductions_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reductions" DROP CONSTRAINT IF EXISTS "reductions_type_article_id_fkey"`);
    await queryRunner.query(`DROP TABLE "reductions"`);
  }
}

