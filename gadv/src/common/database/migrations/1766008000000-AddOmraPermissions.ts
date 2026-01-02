import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOmraPermissions1766008000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissions = [
            'view_omra', 'manage_omra',
            'view_caisse_omra', 'manage_caisse_omra'
        ];

        for (const perm of permissions) {
            const check = await queryRunner.query(`SELECT id FROM permissions WHERE name = '${perm}'`);
            if (check.length === 0) {
                await queryRunner.query(`INSERT INTO permissions (name) VALUES ('${perm}')`);
            }
        }

        console.log('✅ Omra permissions added successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We rarely remove permissions to avoid accidental data loss or constraints issues
    }

}
