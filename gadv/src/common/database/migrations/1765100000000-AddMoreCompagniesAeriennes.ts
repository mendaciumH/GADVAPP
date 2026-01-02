import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMoreCompagniesAeriennes1765100000000 implements MigrationInterface {
  name = 'AddMoreCompagniesAeriennes1765100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert Royal Jordanian if not exists
    await queryRunner.query(`
      INSERT INTO "compagnies_aeriennes" ("nom", "code_iata", "code_icao")
      SELECT 'Royal Jordanian', 'RJ', 'RJA'
      WHERE NOT EXISTS (
        SELECT 1 FROM "compagnies_aeriennes" WHERE "code_iata" = 'RJ'
      )
    `);

    // Insert flynas if not exists
    await queryRunner.query(`
      INSERT INTO "compagnies_aeriennes" ("nom", "code_iata", "code_icao")
      SELECT 'flynas', 'XY', 'KNE'
      WHERE NOT EXISTS (
        SELECT 1 FROM "compagnies_aeriennes" WHERE "code_iata" = 'XY'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "compagnies_aeriennes" WHERE "code_iata" IN ('RJ', 'XY')
    `);
  }
}


