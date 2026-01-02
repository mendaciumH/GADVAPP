import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export const seedAdminUser = async (dataSource: DataSource): Promise<void> => {
  // Get admin password from environment variable
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Use raw SQL query with INSERT ... ON CONFLICT DO NOTHING
  try {
    // First check if roles table exists
    const tableCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      )
    `);

    if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
      console.log('Roles table does not exist yet. Migrations may not have completed. Skipping admin seed...');
      return;
    }

    // Verify admin role exists
    const roleCheck = await dataSource.query(
      `SELECT id FROM roles WHERE id = 1 LIMIT 1`
    );

    if (!roleCheck || roleCheck.length === 0) {
      console.log('Admin role (id: 1) not found. Please ensure migrations have run successfully.');
      return;
    }

    // Check if users table exists
    const usersTableCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    if (!usersTableCheck || !usersTableCheck[0] || !usersTableCheck[0].exists) {
      console.log('Users table does not exist yet. Migrations may not have completed. Skipping admin seed...');
      return;
    }

    // Insert admin user with ON CONFLICT DO NOTHING
    const result = await dataSource.query(
      `INSERT INTO users (id, username, email, motdepasse, role_id)
       VALUES (1, 'admin', 'admin@admin.com', $1, 1)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [hashedPassword]
    );

    if (result && result.length > 0) {
      console.log('Admin user seeded successfully!');
      console.log(`Username: admin`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log('Admin user already exists, skipping seed...');
    }
  } catch (error: any) {
    // If error is about duplicate or constraint violation, it's okay
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      console.log('Admin user already exists, skipping seed...');
    } else {
      console.error('Error seeding admin user:', error.message);
      throw error;
    }
  }
}

