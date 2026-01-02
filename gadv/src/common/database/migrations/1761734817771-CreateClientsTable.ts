import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientsTable1761734817771 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create clients table
    await queryRunner.query(`
      CREATE TABLE if not exists "clients" (
        "id" BIGSERIAL NOT NULL,
        "type_client" text NOT NULL,
        "nom_complet" text,
        "numero_passeport" text,
        "expiration_passeport" date,
        "numero_mobile" text,
        "numero_mobile_2" text,
        "email" text,
        "date_naissance" date,
        "notes" text,
        "image" bytea,
        "nom_entreprise" text,
        "rc" text,
        "nif" text,
        "ai" text,
        "nis" text,
        "prefere_facturation" boolean,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "clients_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "clients_type_client_check" CHECK (("type_client" = ANY (ARRAY['Particulier'::text, 'Entreprise'::text])))
      )
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('clients_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "clients"`);
  }
}

