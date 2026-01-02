import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentFieldsToBonDeVersement1764800000000 implements MigrationInterface {
  name = 'AddPaymentFieldsToBonDeVersement1764800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add facture_id column
    await queryRunner.query(`
      ALTER TABLE "bon_de_versement" 
      ADD COLUMN IF NOT EXISTS "facture_id" BIGINT NULL
    `);

    // Add annule column
    await queryRunner.query(`
      ALTER TABLE "bon_de_versement" 
      ADD COLUMN IF NOT EXISTS "annule" BOOLEAN DEFAULT FALSE
    `);

    // Add foreign key constraint for facture_id
    await queryRunner.query(`
      ALTER TABLE "bon_de_versement"
      ADD CONSTRAINT "FK_bon_de_versement_facture"
      FOREIGN KEY ("facture_id") REFERENCES "factures"("id")
      ON DELETE SET NULL
    `);

    // Create index for facture_id for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bon_de_versement_facture_id" 
      ON "bon_de_versement" ("facture_id")
    `);

    // Create index for annule for filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bon_de_versement_annule" 
      ON "bon_de_versement" ("annule")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bon_de_versement_annule"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bon_de_versement_facture_id"`);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "bon_de_versement"
      DROP CONSTRAINT IF EXISTS "FK_bon_de_versement_facture"
    `);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "bon_de_versement" DROP COLUMN IF EXISTS "annule"`);
    await queryRunner.query(`ALTER TABLE "bon_de_versement" DROP COLUMN IF EXISTS "facture_id"`);
  }
}

