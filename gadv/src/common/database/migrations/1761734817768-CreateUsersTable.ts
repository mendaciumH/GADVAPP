import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1761734817768 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" BIGSERIAL NOT NULL,
        "username" text NOT NULL,
        "motdepasse" text NOT NULL,
        "role_id" bigint,
        "email" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key for role_id if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_role_id_fkey'
        ) THEN
          ALTER TABLE "users" 
          ADD CONSTRAINT "users_role_id_fkey" 
          FOREIGN KEY ("role_id") REFERENCES "roles"("id");
        END IF;
      END $$;
    `);

    // Reset sequence
    await queryRunner.query(`
      SELECT pg_catalog.setval('users_id_seq', 1, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_id_fkey"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

