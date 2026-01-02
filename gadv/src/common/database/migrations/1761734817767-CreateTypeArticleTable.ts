import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTypeArticleTable1761734817767 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create type_article table
    await queryRunner.query(`
      CREATE TABLE "type_article" (
        "id" BIGSERIAL NOT NULL,
        "description" text NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "type_article_pkey" PRIMARY KEY ("id")
      )
    `);

    // Insert seed data
    await queryRunner.query(`
      INSERT INTO "type_article" ("id", "description") VALUES 
      (1, 'Omra'),
      (2, 'Voyage organisé'),
      (3, 'Billet d''avion'),
      (4, 'Demande Visa'),
      (5, 'Assurance voyage'),
      (6, 'Réservation hôtels')
    `);

    // Reset sequence to continue from 33
    await queryRunner.query(`
      SELECT pg_catalog.setval('type_article_id_seq', 33, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "type_article"`);
  }
}

