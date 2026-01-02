import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCompagnieAerienneToId1762349600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add compagnie_aerienne_id column if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN IF NOT EXISTS "compagnie_aerienne_id" bigint
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'articles_compagnie_aerienne_id_fkey'
        ) THEN
          ALTER TABLE "articles" 
          ADD CONSTRAINT "articles_compagnie_aerienne_id_fkey" 
          FOREIGN KEY ("compagnie_aerienne_id") REFERENCES "compagnies_aeriennes"("id");
        END IF;
      END $$;
    `);

    // Drop old compagnie_aerienne text column if it exists
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP COLUMN IF EXISTS "compagnie_aerienne"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back compagnie_aerienne text column
    await queryRunner.query(`
      ALTER TABLE "articles" 
      ADD COLUMN IF NOT EXISTS "compagnie_aerienne" text
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP CONSTRAINT IF EXISTS "articles_compagnie_aerienne_id_fkey"
    `);

    // Drop compagnie_aerienne_id column
    await queryRunner.query(`
      ALTER TABLE "articles" 
      DROP COLUMN IF EXISTS "compagnie_aerienne_id"
    `);
  }
}

