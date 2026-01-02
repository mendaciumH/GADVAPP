import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticlesTable1761734817772 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create articles table with only common fields
    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id" BIGSERIAL NOT NULL,
        "date_depart" timestamp with time zone,
        "label" text NOT NULL,
        "description" text,
        "image_banner" text,
        "fournisseur_id" bigint,
        "commission" numeric(10,2),
        "offre_limitee" boolean,
        "disponibilite" integer,
        "prix_offre" numeric(10,2),
        "is_archiver" boolean,
        "is_published" boolean DEFAULT false,
        "id_type_article" bigint,
        "compagnie" text,
        "ville_depart" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD CONSTRAINT "articles_fournisseur_id_fkey" 
      FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD CONSTRAINT "articles_id_type_article_fkey" 
      FOREIGN KEY ("id_type_article") REFERENCES "type_article"("id")
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('articles_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_id_type_article_fkey"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_fournisseur_id_fkey"`);
    await queryRunner.query(`DROP TABLE "articles"`);
  }
}
