import { DataSource } from 'typeorm';

/**
 * All permissions from PAGE_PERMISSIONS
 * This list should match the permissions defined in the frontend
 */
const ALL_PERMISSIONS = [
  'view_dashboard',
  'manage_users',
  'manage_roles',
  'manage_permissions',
  'view_clients',
  'manage_clients',
  'view_fournisseurs',
  'manage_fournisseurs',
  'view_articles',
  'manage_articles',
  'view_commandes',
  'manage_commandes',
  'view_reductions',
  'manage_reductions',
  'view_taxes',
  'manage_taxes',
  'view_caisses',
  'manage_caisses',
  'view_factures',
  'manage_factures',
  'view_bon_de_versement',
  'manage_bon_de_versement',
  'view_info_agence',
  'manage_info_agence',
  'publish_content',
];

export const seedPermissions = async (dataSource: DataSource): Promise<void> => {
  try {
    // First check if permissions table exists
    const tableCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      )
    `);

    if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
      console.log('Permissions table does not exist yet. Migrations may not have completed. Skipping permissions seed...');
      return;
    }

    // Get existing permissions
    const existingPermissions = await dataSource.query(
      `SELECT name FROM permissions`
    );
    const existingNames = new Set(existingPermissions.map((p: any) => p.name));

    // Find missing permissions
    const missingPermissions = ALL_PERMISSIONS.filter(
      name => !existingNames.has(name)
    );

    if (missingPermissions.length === 0) {
      console.log('All permissions already exist, skipping seed...');
      return;
    }

    // Insert missing permissions
    // Check if unique constraint exists on name column
    const hasUniqueConstraint = await dataSource.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'permissions_name_unique'
      )
    `);

    const useOnConflict = hasUniqueConstraint && hasUniqueConstraint[0] && hasUniqueConstraint[0].exists;

    for (const permissionName of missingPermissions) {
      try {
        if (useOnConflict) {
          await dataSource.query(
            `INSERT INTO permissions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
            [permissionName]
          );
        } else {
          // Check if permission already exists before inserting
          const exists = await dataSource.query(
            `SELECT id FROM permissions WHERE name = $1 LIMIT 1`,
            [permissionName]
          );
          if (exists.length === 0) {
            await dataSource.query(
              `INSERT INTO permissions (name) VALUES ($1)`,
              [permissionName]
            );
          }
        }
        console.log(`✓ Permission "${permissionName}" seeded`);
      } catch (error: any) {
        // If error is about duplicate or constraint violation, it's okay
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          console.log(`Permission "${permissionName}" already exists, skipping...`);
        } else {
          console.error(`Error seeding permission "${permissionName}":`, error.message);
        }
      }
    }

    console.log(`✅ Permissions seeding completed! ${missingPermissions.length} new permissions added.`);
  } catch (error: any) {
    console.error('Error seeding permissions:', error.message);
    // Don't throw - allow app to continue even if seeding fails
  }
};

