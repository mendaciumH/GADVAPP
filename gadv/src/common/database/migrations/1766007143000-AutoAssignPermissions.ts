import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoAssignPermissions1766007143000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ensure new permissions exist
        const permissions = [
            'view_sessions', 'manage_sessions',
            'view_taxes', 'manage_taxes',
            'view_reductions', 'manage_reductions',
            'view_type_article', 'manage_type_article',
            'view_compagnies_aeriennes', 'manage_compagnies_aeriennes'
        ];

        for (const perm of permissions) {
            // Using logic that works for Postgres to insert if not exists
            // Assuming 'name' is unique or checking existence first
            const check = await queryRunner.query(`SELECT id FROM permissions WHERE name = '${perm}'`);
            if (check.length === 0) {
                await queryRunner.query(`INSERT INTO permissions (name) VALUES ('${perm}')`);
            }
        }

        // 2. Propagate Permissions

        // Helper function to link source permission to target permission for all roles
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

        // Articles -> Sessions
        await propagate('view_articles', 'view_sessions');
        await propagate('manage_articles', 'manage_sessions');

        // Articles -> Type Article
        await propagate('view_articles', 'view_type_article');
        await propagate('manage_articles', 'manage_type_article');

        // Articles -> Compagnies Aeriennes
        await propagate('view_articles', 'view_compagnies_aeriennes');
        await propagate('manage_articles', 'manage_compagnies_aeriennes');

        // Factures -> Taxes
        await propagate('view_factures', 'view_taxes');
        await propagate('manage_factures', 'manage_taxes');

        // Factures -> Reductions
        await propagate('view_factures', 'view_reductions');
        await propagate('manage_factures', 'manage_reductions');

        console.log('✅ Permissions auto-assigned successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverting this is complex because we don't know which ones were added by us vs existed before.
        // For safety, we usually don't delete permissions in down() migrations unless we are sure.
        // We can optionally remove the permissions if we are sure they shouldn't exist, but here we just leave them.
    }

}
