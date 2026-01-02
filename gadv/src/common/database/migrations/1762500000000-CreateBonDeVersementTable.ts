import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBonDeVersementTable1762500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create bon_de_versement table
    await queryRunner.query(`
      CREATE TABLE "bon_de_versement" (
        "id" BIGSERIAL NOT NULL,
        "numero" text NOT NULL UNIQUE,
        "date_versement" date NOT NULL,
        "client_id" bigint NOT NULL,
        "commande_id" bigint NOT NULL,
        "montant_verse" numeric(10,2) NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "bon_de_versement_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "bon_de_versement" 
      ADD CONSTRAINT "bon_de_versement_client_id_fkey" 
      FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "bon_de_versement" 
      ADD CONSTRAINT "bon_de_versement_commande_id_fkey" 
      FOREIGN KEY ("commande_id") REFERENCES "commandes"("id") ON DELETE CASCADE
    `);

    // Create indexes for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_bon_de_versement_numero" ON "bon_de_versement" ("numero")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_bon_de_versement_client_id" ON "bon_de_versement" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_bon_de_versement_commande_id" ON "bon_de_versement" ("commande_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_bon_de_versement_date_versement" ON "bon_de_versement" ("date_versement")
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('bon_de_versement_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bon_de_versement_date_versement"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bon_de_versement_commande_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bon_de_versement_client_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bon_de_versement_numero"`);
    await queryRunner.query(`ALTER TABLE "bon_de_versement" DROP CONSTRAINT IF EXISTS "bon_de_versement_commande_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "bon_de_versement" DROP CONSTRAINT IF EXISTS "bon_de_versement_client_id_fkey"`);
    await queryRunner.query(`DROP TABLE "bon_de_versement"`);
  }
}

