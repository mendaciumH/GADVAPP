import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionsTable1761734817765 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" BIGSERIAL NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
      )
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('permissions_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}

