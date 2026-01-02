import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToPermissions1764700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if constraint already exists
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'permissions_name_unique'
      )
    `);

    if (!constraintExists || !constraintExists[0] || !constraintExists[0].exists) {
      // First, remove any duplicate permissions (keep the one with the lowest id)
      await queryRunner.query(`
        DELETE FROM permissions
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM permissions
          GROUP BY name
        )
      `);

      // Add unique constraint on name
      await queryRunner.query(`
        ALTER TABLE "permissions"
        ADD CONSTRAINT "permissions_name_unique" UNIQUE ("name")
      `);

      console.log('✓ Added unique constraint on permissions.name');
    } else {
      console.log('Unique constraint on permissions.name already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permissions"
      DROP CONSTRAINT IF EXISTS "permissions_name_unique"
    `);
  }
}

