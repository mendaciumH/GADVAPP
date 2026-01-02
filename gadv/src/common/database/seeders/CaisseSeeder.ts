import { DataSource } from 'typeorm';

export const seedCaissePrincipale = async (dataSource: DataSource): Promise<void> => {
  try {
    // Check if caisses table exists
    const tableCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'caisses'
      )
    `);

    if (!tableCheck || !tableCheck[0] || !tableCheck[0].exists) {
      console.log('Caisses table does not exist yet. Migrations may not have completed. Skipping caisse seed...');
      return;
    }

    // Check if caisse principale already exists
    const existingCaisse = await dataSource.query(
      `SELECT id FROM caisses WHERE is_principale = TRUE LIMIT 1`
    );

    if (existingCaisse && existingCaisse.length > 0) {
      console.log('Caisse principale already exists, skipping seed...');
      return;
    }

    // Insert caisse principale
    const result = await dataSource.query(
      `INSERT INTO caisses (nom_caisse, montant_depart, solde_actuel, devise, is_principale)
       VALUES ('Caisse principale', 0, 0, 'DZD', TRUE)
       ON CONFLICT DO NOTHING
       RETURNING id`
    );

    if (result && result.length > 0) {
      console.log('✅ Caisse principale created successfully!');
      console.log('   - Name: Caisse principale');
      console.log('   - Starting amount: 0 DZD');
      console.log('   - Currency: DZD');
    } else {
      console.log('Caisse principale may already exist or could not be created.');
    }

    // Check if Caisse Omra already exists
    const existingCaisseOmra = await dataSource.query(
      `SELECT id FROM caisses WHERE nom_caisse = 'Caisse Omra' LIMIT 1`
    );

    if (existingCaisseOmra && existingCaisseOmra.length > 0) {
      console.log('Caisse Omra already exists, skipping seed...');
    } else {
      // Insert Caisse Omra
      const resultOmra = await dataSource.query(
        `INSERT INTO caisses (nom_caisse, montant_depart, solde_actuel, devise, is_principale)
         VALUES ('Caisse Omra', 0, 0, 'DZD', FALSE)
         ON CONFLICT DO NOTHING
         RETURNING id`
      );

      if (resultOmra && resultOmra.length > 0) {
        console.log('✅ Caisse Omra created successfully!');
        console.log('   - Name: Caisse Omra');
        console.log('   - Starting amount: 0 DZD');
        console.log('   - Currency: DZD');
      }
    }

  } catch (error: any) {
    // If error is about duplicate or constraint violation, it's okay
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      console.log('Caisse seed completed with some duplicates skipped.');
    } else {
      console.error('Error seeding caisses:', error.message);
      // Don't throw - allow app to continue
    }
  }
};

