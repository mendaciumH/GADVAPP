const { Client } = require('pg');

async function testCodeStringMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'gestionadv_db'
    });

    try {
        await client.connect();
        console.log('🔌 Connecté à la base de données PostgreSQL');

        // Vérifier la structure des tables avant migration
        console.log('\n📋 Structure des tables AVANT migration:');
        
        const wilayaStructure = await client.query(`
            SELECT column_name, data_type, column_default, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'wilayas'
            ORDER BY ordinal_position
        `);
        console.log('wilayas (avec ordre):', wilayaStructure.rows);

        const communeStructure = await client.query(`
            SELECT column_name, data_type, column_default, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'communes'
            ORDER BY ordinal_position
        `);
        console.log('communes (avec ordre):', communeStructure.rows);

        const addressStructure = await client.query(`
            SELECT column_name, data_type, column_default, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'addresses'
            ORDER BY ordinal_position
        `);
        console.log('addresses (avec ordre):', addressStructure.rows);

        // Vérifier quelques données existantes
        console.log('\n📊 Données existantes:');
        
        const wilayaData = await client.query(`
            SELECT code, name FROM "wilayas" ORDER BY code LIMIT 5
        `);
        console.log('Wilayas (5 premières):', wilayaData.rows);

        const communeData = await client.query(`
            SELECT code, name, wilaya_code FROM "communes" ORDER BY code LIMIT 5
        `);
        console.log('Communes (5 premières):', communeData.rows);

        // Vérifier les contraintes de clé étrangère
        console.log('\n🔒 Contraintes de clé étrangère:');
        
        const fkConstraints = await client.query(`
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name IN ('communes', 'addresses')
            ORDER BY tc.table_name, kcu.column_name
        `);
        console.log('Contraintes FK:', fkConstraints.rows);

        // Vérifier les clés primaires
        console.log('\n🔑 Clés primaires:');
        
        const pkConstraints = await client.query(`
            SELECT 
                tc.table_name, 
                kcu.column_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_name IN ('wilayas', 'communes', 'addresses')
            ORDER BY tc.table_name, kcu.ordinal_position
        `);
        console.log('Clés primaires:', pkConstraints.rows);

        console.log('\n✅ Test de vérification terminé avec succès !');
        console.log('📝 La migration ChangeCodeToString est prête à être exécutée.');
        console.log('\n📋 Ordre attendu des colonnes après migration:');
        console.log('wilayas: code, name, arabic_name');
        console.log('communes: code, wilaya_code, name, arabic_name');
        console.log('addresses: id, street, commune_code');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Déconnecté de la base de données');
    }
}

// Exécuter le test
testCodeStringMigration(); 