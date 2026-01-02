import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDateFromOmraAndDisponibiliteFromArticles1765400000000 implements MigrationInterface {
  name = 'RemoveDateFromOmraAndDisponibiliteFromArticles1765400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove date column from articles_omra table (now using sessions table)
    await queryRunner.query(`
      ALTER TABLE "articles_omra" 
      DROP COLUMN IF EXISTS "date"
    `);

    // Remove disponibilite column from articles table (now using sessions table)
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP COLUMN IF EXISTS "disponibilite"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore date column to articles_omra table
    await queryRunner.query(`
      ALTER TABLE "articles_omra" 
      ADD COLUMN IF NOT EXISTS "date" text[]
    `);

    // Restore disponibilite column to articles table
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN IF NOT EXISTS "disponibilite" integer
    `);
  }
}

