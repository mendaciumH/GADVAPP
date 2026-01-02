import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompagniesAeriennesTable1762349500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create compagnies_aeriennes table
    await queryRunner.query(`
      CREATE TABLE "compagnies_aeriennes" (
        "id" BIGSERIAL NOT NULL,
        "nom" text NOT NULL,
        "code_iata" text,
        "code_icao" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "compagnies_aeriennes_pkey" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "compagnies_aeriennes" ("nom", "code_iata", "code_icao") VALUES 
      ('Air Algérie', 'AH', 'DAH'),
      ('Air France', 'AF', 'AFR'),
      ('Lufthansa', 'LH', 'DLH'),
      ('British Airways', 'BA', 'BAW'),
      ('Emirates', 'EK', 'UAE'),
      ('Turkish Airlines', 'TK', 'THY'),
      ('Qatar Airways', 'QR', 'QTR'),
      ('Royal Air Maroc', 'AT', 'RAM'),
      ('Tunisair', 'TU', 'TAR'),
      ('EgyptAir', 'MS', 'MSR'),
      ('Saudi Arabian Airlines', 'SV', 'SVA'),
      ('Etihad Airways', 'EY', 'ETD'),
      ('KLM', 'KL', 'KLM'),
      ('Iberia', 'IB', 'IBE'),
      ('Alitalia', 'AZ', 'AZA'),
      ('Royal Jordanian', 'RJ', 'RJA'),
      ('flynas', 'XY', 'KNE')
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('compagnies_aeriennes_id_seq', 17, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "compagnies_aeriennes"`);
  }
}

