import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCaisseSoldeAndPrincipale1764900000000 implements MigrationInterface {
  name = 'AddCaisseSoldeAndPrincipale1764900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add solde_actuel column
    await queryRunner.query(`
      ALTER TABLE "caisses" 
      ADD COLUMN IF NOT EXISTS "solde_actuel" DECIMAL(10,2) DEFAULT 0
    `);

    // Add is_principale column
    await queryRunner.query(`
      ALTER TABLE "caisses" 
      ADD COLUMN IF NOT EXISTS "is_principale" BOOLEAN DEFAULT FALSE
    `);

    // Update devise default value
    await queryRunner.query(`
      ALTER TABLE "caisses" 
      ALTER COLUMN "devise" SET DEFAULT 'DZD'
    `);

    // Update montant_depart default value
    await queryRunner.query(`
      ALTER TABLE "caisses" 
      ALTER COLUMN "montant_depart" SET DEFAULT 0
    `);

    // Update existing rows to have default values
    await queryRunner.query(`
      UPDATE "caisses" 
      SET "solde_actuel" = COALESCE("montant_depart", 0)
      WHERE "solde_actuel" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "caisses" 
      SET "devise" = 'DZD'
      WHERE "devise" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "caisses" DROP COLUMN IF EXISTS "is_principale"`);
    await queryRunner.query(`ALTER TABLE "caisses" DROP COLUMN IF EXISTS "solde_actuel"`);
  }
}

