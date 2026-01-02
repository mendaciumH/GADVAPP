import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissionsTable1761734817766 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create role_permissions table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" bigint NOT NULL,
        "permission_id" bigint NOT NULL,
        CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
      )
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "role_permissions_role_id_fkey" 
      FOREIGN KEY ("role_id") REFERENCES "roles"("id")
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "role_permissions_permission_id_fkey" 
      FOREIGN KEY ("permission_id") REFERENCES "permissions"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_permission_id_fkey"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_role_id_fkey"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
  }
}

