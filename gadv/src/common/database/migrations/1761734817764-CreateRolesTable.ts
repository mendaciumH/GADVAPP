import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesTable1761734817764 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" BIGSERIAL NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
      )
    `);

    // Insert seed data
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "name") VALUES 
      (1, 'admin'),
      (2, 'Manager'),
      (3, 'Comptable'),
      (4, 'Agent de comptoir')
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('roles_id_seq', 1, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}

