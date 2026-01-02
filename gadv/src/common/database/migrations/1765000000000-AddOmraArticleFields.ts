import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOmraArticleFields1765000000000 implements MigrationInterface {
  name = 'AddOmraArticleFields1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================
    // Add Omra-specific fields to articles_omra table
    // =============================================

    // Add distance_hotel column (distance from hotel to Haram in meters)
    await queryRunner.query(`
      ALTER TABLE "articles_omra" 
      ADD COLUMN IF NOT EXISTS "distance_hotel" INTEGER
    `);

    // Add entree column (entry city)
    await queryRunner.query(`
      ALTER TABLE "articles_omra" 
      ADD COLUMN IF NOT EXISTS "entree" TEXT
    `);

    // Add sortie column (exit city)
    await queryRunner.query(`
      ALTER TABLE "articles_omra" 
      ADD COLUMN IF NOT EXISTS "sortie" TEXT
    `);

    // =============================================
    // Add general fields to articles table
    // =============================================

    // Add type_fly column (direct or avec_escale)
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN IF NOT EXISTS "type_fly" TEXT
    `);

    // Add date_retour column (return date)
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN IF NOT EXISTS "date_retour" TIMESTAMPTZ
    `);

    // Add compagnie_aerienne_id column (foreign key to compagnies_aeriennes)
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN IF NOT EXISTS "compagnie_aerienne_id" BIGINT
    `);

    // Add foreign key constraint for compagnie_aerienne_id
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_articles_compagnie_aerienne' 
          AND table_name = 'articles'
        ) THEN
          ALTER TABLE "articles" 
          ADD CONSTRAINT "FK_articles_compagnie_aerienne" 
          FOREIGN KEY ("compagnie_aerienne_id") 
          REFERENCES "compagnies_aeriennes"("id") 
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns from articles_omra
    await queryRunner.query(`ALTER TABLE "articles_omra" DROP COLUMN IF EXISTS "sortie"`);
    await queryRunner.query(`ALTER TABLE "articles_omra" DROP COLUMN IF EXISTS "entree"`);
    await queryRunner.query(`ALTER TABLE "articles_omra" DROP COLUMN IF EXISTS "distance_hotel"`);

    // Drop foreign key constraint from articles
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP CONSTRAINT IF EXISTS "FK_articles_compagnie_aerienne"
    `);

    // Drop columns from articles
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "compagnie_aerienne_id"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "date_retour"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN IF EXISTS "type_fly"`);
  }
}
