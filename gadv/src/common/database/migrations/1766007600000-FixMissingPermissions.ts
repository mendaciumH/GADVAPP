import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMissingPermissions1766007600000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ensure new permissions exist
        const permissions = [
            'view_type_article', 'manage_type_article',
            'view_compagnies_aeriennes', 'manage_compagnies_aeriennes'
        ];

        for (const perm of permissions) {
            const check = await queryRunner.query(`SELECT id FROM permissions WHERE name = '${perm}'`);
            if (check.length === 0) {
                await queryRunner.query(`INSERT INTO permissions (name) VALUES ('${perm}')`);
            }
        }

        // 2. Propagate Permissions helper
        const propagate = async (source: string, target: string) => {
            await queryRunner.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT rp.role_id, p_target.id
                FROM role_permissions rp
                JOIN permissions p_source ON rp.permission_id = p_source.id
                JOIN permissions p_target ON p_target.name = '${target}'
                WHERE p_source.name = '${source}'
                AND NOT EXISTS (
                    SELECT 1 FROM role_permissions rp2 
                    WHERE rp2.role_id = rp.role_id 
                    AND rp2.permission_id = p_target.id
                )
            `);
        };

        // Articles -> Type Article
        await propagate('view_articles', 'view_type_article');
        await propagate('manage_articles', 'manage_type_article');

        // Articles -> Compagnies Aeriennes
        await propagate('view_articles', 'view_compagnies_aeriennes');
        await propagate('manage_articles', 'manage_compagnies_aeriennes');

        console.log('✅ Fix Missing Permissions auto-assigned successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No explicit down needed as we don't want to break things if we rollback this fix, 
        // permissions are generally additive.
    }

}
