import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEtatCreancesPermissions1766009000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create dedicated permissions for État des Créances
        // This allows granular control over who can see financial totals
        const permissions = ['view_etat_creances', 'manage_etat_creances'];

        for (const permission of permissions) {
            const check = await queryRunner.query(`SELECT id FROM permissions WHERE name = '${permission}'`);
            if (check.length === 0) {
                await queryRunner.query(`INSERT INTO permissions (name) VALUES ('${permission}')`);
                console.log(`✅ Permission '${permission}' added successfully`);
            } else {
                console.log(`ℹ️  Permission '${permission}' already exists`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We rarely remove permissions to avoid accidental data loss
        await queryRunner.query(`DELETE FROM permissions WHERE name IN ('view_etat_creances', 'manage_etat_creances')`);
    }

}
