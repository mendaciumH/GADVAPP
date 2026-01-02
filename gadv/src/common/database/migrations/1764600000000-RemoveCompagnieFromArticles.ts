import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCompagnieFromArticles1764600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove the compagnie column from articles table
    await queryRunner.query(`
      ALTER TABLE "articles" DROP COLUMN IF EXISTS "compagnie"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add the compagnie column back to articles table
    await queryRunner.query(`
      ALTER TABLE "articles" ADD COLUMN "compagnie" text
    `);
  }
}

