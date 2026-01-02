import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommandesTable1761734817773 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create commandes table with all columns
    await queryRunner.query(`
      CREATE TABLE "commandes" (
        "id" BIGSERIAL NOT NULL,
        "client_id" bigint,
        "article_id" bigint,
        "session_id" bigint,
        "date" timestamp with time zone,
        "beneficiaire" boolean,
        "nom" text,
        "prenom" text,
        "date_naissance" date,
        "genre" text,
        "numero_passport" text,
        "date_expiration_passport" date,
        "numero_mobile" text,
        "remarques" text,
        "image" bytea,
        "prix" numeric(10,2),
        "reductions" numeric(10,2),
        "autre_reductions" numeric(10,2),
        "taxes" numeric(10,2),
        "nombre_personnes" integer,
        "chambre_id" integer,
        "user_id" bigint,
        "numero_bon_commande" varchar(50),
        "statut" varchar(20) NOT NULL DEFAULT 'active',
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "commandes" 
      ADD CONSTRAINT "commandes_client_id_fkey" 
      FOREIGN KEY ("client_id") REFERENCES "clients"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "commandes" 
      ADD CONSTRAINT "commandes_article_id_fkey" 
      FOREIGN KEY ("article_id") REFERENCES "articles"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "commandes" 
      ADD CONSTRAINT "commandes_user_id_fkey" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_commandes_user_id" ON "commandes"("user_id")
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('commandes_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_commandes_user_id"`);
    await queryRunner.query(`ALTER TABLE "commandes" DROP CONSTRAINT IF EXISTS "commandes_user_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "commandes" DROP CONSTRAINT IF EXISTS "commandes_article_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "commandes" DROP CONSTRAINT IF EXISTS "commandes_client_id_fkey"`);
    await queryRunner.query(`DROP TABLE "commandes"`);
  }
}

