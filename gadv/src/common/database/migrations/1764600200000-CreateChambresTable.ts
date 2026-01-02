import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChambresTable1764600200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chambres table
    await queryRunner.query(`
      CREATE TABLE "chambres" (
        "id" BIGSERIAL NOT NULL,
        "article_id" bigint NOT NULL,
        "type_chambre" text NOT NULL,
        "prix" numeric(10,2) NOT NULL DEFAULT 0,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chambres_pkey" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "chambres" 
      ADD CONSTRAINT "chambres_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_chambres_article_id" ON "chambres" ("article_id")
    `);

    // Migrate existing data from articles_omra.chambres (text[]) to the new table
    // Each text element becomes a room type with price 0
    await queryRunner.query(`
      INSERT INTO "chambres" ("article_id", "type_chambre", "prix")
      SELECT 
        ao.article_id,
        unnest(ao.chambres) as type_chambre,
        0 as prix
      FROM "articles_omra" ao
      WHERE ao.chambres IS NOT NULL AND array_length(ao.chambres, 1) > 0
    `);

    // Remove chambres column from articles_omra
    await queryRunner.query(`
      ALTER TABLE "articles_omra" DROP COLUMN IF EXISTS "chambres"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add chambres column back to articles_omra as text[]
    await queryRunner.query(`
      ALTER TABLE "articles_omra" ADD COLUMN "chambres" text[]
    `);

    // Migrate data back (only types, no prices in text[] format)
    await queryRunner.query(`
      UPDATE "articles_omra" ao
      SET chambres = (
        SELECT array_agg(c.type_chambre)
        FROM "chambres" c
        WHERE c.article_id = ao.article_id
      )
    `);

    // Drop the chambres table
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_chambres_article_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chambres"`);
  }
}

