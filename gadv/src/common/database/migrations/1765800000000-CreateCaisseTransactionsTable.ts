import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCaisseTransactionsTable1765800000000 implements MigrationInterface {
    name = 'CreateCaisseTransactionsTable1765800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TYPE "caisse_transactions_type_enum" AS ENUM ('encaissement', 'décaissement')
    `);
        await queryRunner.query(`
      CREATE TYPE "caisse_transactions_reference_type_enum" AS ENUM ('facture', 'bon_versement', 'bon_remboursement')
    `);

        await queryRunner.query(`
      CREATE TABLE "caisse_transactions" (
        "id" BIGSERIAL NOT NULL,
        "caisse_id" bigint NOT NULL,
        "user_id" bigint,
        "type" "caisse_transactions_type_enum" NOT NULL,
        "montant" numeric(10, 2) NOT NULL,
        "reference_type" "caisse_transactions_reference_type_enum" NOT NULL,
        "reference_id" bigint NOT NULL,
        "description" text,
        "date_transaction" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caisse_transactions_id" PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
      ALTER TABLE "caisse_transactions" 
      ADD CONSTRAINT "FK_caisse_transactions_caisse_id" 
      FOREIGN KEY ("caisse_id") REFERENCES "caisses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "caisse_transactions" 
      ADD CONSTRAINT "FK_caisse_transactions_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_caisse_transactions_caisse_id" ON "caisse_transactions" ("caisse_id")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_caisse_transactions_type" ON "caisse_transactions" ("type")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_caisse_transactions_date_transaction" ON "caisse_transactions" ("date_transaction")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_caisse_transactions_date_transaction"`);
        await queryRunner.query(`DROP INDEX "IDX_caisse_transactions_type"`);
        await queryRunner.query(`DROP INDEX "IDX_caisse_transactions_caisse_id"`);
        await queryRunner.query(`ALTER TABLE "caisse_transactions" DROP CONSTRAINT "FK_caisse_transactions_user_id"`);
        await queryRunner.query(`ALTER TABLE "caisse_transactions" DROP CONSTRAINT "FK_caisse_transactions_caisse_id"`);
        await queryRunner.query(`DROP TABLE "caisse_transactions"`);
        await queryRunner.query(`DROP TYPE "caisse_transactions_reference_type_enum"`);
        await queryRunner.query(`DROP TYPE "caisse_transactions_type_enum"`);
    }
}
