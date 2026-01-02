const { Client } = require('pg');

async function testColumnOrder() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'gadv_db'
    });

    try {
        await client.connect();
        console.log('🔌 Connecté à la base de données PostgreSQL');

        console.log('\n📋 Vérification de l\'ordre des colonnes:');
        
        // Vérifier l'ordre des colonnes dans wilayas
        const wilayaColumns = await client.query(`
            SELECT column_name, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'wilayas'
            ORDER BY ordinal_position
        `);
        
        console.log('\n🏛️  Table wilayas:');
        wilayaColumns.rows.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.column_name}`);
        });
        
        // Vérifier l'ordre des colonnes dans communes
        const communeColumns = await client.query(`
            SELECT column_name, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'communes'
            ORDER BY ordinal_position
        `);
        
        console.log('\n🏘️  Table communes:');
        communeColumns.rows.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.column_name}`);
        });
        
        // Vérifier l'ordre des colonnes dans addresses
        const addressColumns = await client.query(`
            SELECT column_name, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'addresses'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📍 Table addresses:');
        addressColumns.rows.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.column_name}`);
        });
        
        // Vérifier les types des colonnes code
        
        const wilayaCodeType = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'wilayas' AND column_name = 'code'
        `);
        console.log('wilayas.code:', wilayaCodeType.rows[0]);
        
        const communeCodeType = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'communes' AND column_name = 'code'
        `);
        console.log('communes.code:', communeCodeType.rows[0]);
        
        const addressCommuneCodeType = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'addresses' AND column_name = 'commune_code'
        `);
        console.log('addresses.commune_code:', addressCommuneCodeType.rows[0]);
        
        // Vérifier l'ordre attendu
        console.log('\n✅ Ordre attendu:');
        console.log('wilayas: code, name, arabic_name');
        console.log('communes: code, wilaya_code, name, arabic_name');
        console.log('addresses: id, commune_code, street');
        
        // Vérifier si l'ordre est correct
        const expectedWilayaOrder = ['code', 'name', 'arabic_name'];
        const expectedCommuneOrder = ['code', 'wilaya_code', 'name', 'arabic_name'];
        const expectedAddressOrder = ['id', 'commune_code', 'street'];
        
        const actualWilayaOrder = wilayaColumns.rows.map(row => row.column_name);
        const actualCommuneOrder = communeColumns.rows.map(row => row.column_name);
        const actualAddressOrder = addressColumns.rows.map(row => row.column_name);
        
        
        const wilayaCorrect = JSON.stringify(actualWilayaOrder) === JSON.stringify(expectedWilayaOrder);
        const communeCorrect = JSON.stringify(actualCommuneOrder) === JSON.stringify(expectedCommuneOrder);
        const addressCorrect = JSON.stringify(actualAddressOrder) === JSON.stringify(expectedAddressOrder);
        
        console.log(`wilayas: ${wilayaCorrect ? '✅' : '❌'} ${wilayaCorrect ? 'Correct' : 'Incorrect'}`);
        console.log(`communes: ${communeCorrect ? '✅' : '❌'} ${communeCorrect ? 'Correct' : '❌'}`);
        console.log(`addresses: ${addressCorrect ? '✅' : '❌'} ${addressCorrect ? 'Correct' : 'Incorrect'}`);
        
        if (wilayaCorrect && communeCorrect && addressCorrect) {
            console.log('\n🎉 Toutes les colonnes sont dans le bon ordre !');
        } else {
            console.log('\n⚠️  Certaines colonnes ne sont pas dans le bon ordre.');
            console.log('💡 Exécutez la migration ReorderColumns pour corriger cela.');
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await client.end();
        console.log('\n🔌 Déconnecté de la base de données');
    }
}

// Exécuter le test
testColumnOrder(); 