#!/usr/bin/env node

/**
 * Script de vérification de la migration PropertyTypes Auto-Increment
 * 
 * Ce script vérifie que la table propertyTypes a bien été migrée vers l'auto-increment
 */

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'gestionadv_db'
});

async function verifyMigration() {
  try {
    await client.connect();
    
    console.log('✅ Connexion réussie !');
    
    // 1. Vérifier la structure de la table
    console.log('\n📋 Vérification de la structure de la table propertyTypes...');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'propertyTypes' 
      ORDER BY ordinal_position
    `);
    
    console.log('Structure de la table :');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // 2. Vérifier la séquence d'auto-increment
    console.log('\n🔢 Vérification de la séquence d\'auto-increment...');
    const sequenceResult = await client.query(`
      SELECT pg_get_serial_sequence('propertyTypes', 'id') as sequence_name
    `);
    
    if (sequenceResult.rows[0].sequence_name) {
      console.log('✅ Séquence d\'auto-increment trouvée :', sequenceResult.rows[0].sequence_name);
      
      // Vérifier la valeur actuelle de la séquence
      const currentValueResult = await client.query(`
        SELECT currval('${sequenceResult.rows[0].sequence_name}') as current_value
      `);
      console.log('📊 Valeur actuelle de la séquence :', currentValueResult.rows[0].current_value);
    } else {
      console.log('❌ Aucune séquence d\'auto-increment trouvée');
    }
    
    // 3. Vérifier les données existantes
    console.log('\n📊 Vérification des données existantes...');
    const dataResult = await client.query(`
      SELECT id, name FROM "propertyTypes" ORDER BY id
    `);
    
    console.log('Données existantes :');
    dataResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Nom: ${row.name}`);
    });
    
    // 4. Tester l'auto-increment
    console.log('\n🧪 Test de l\'auto-increment...');
    const testInsertResult = await client.query(`
      INSERT INTO "propertyTypes" (name) VALUES ('Type Test Auto-Increment') RETURNING id, name
    `);
    
    console.log('✅ Nouveau type inséré avec succès :', testInsertResult.rows[0]);
    
    // 5. Nettoyer le test
    console.log('\n🧹 Nettoyage du test...');
    await client.query(`
      DELETE FROM "propertyTypes" WHERE name = 'Type Test Auto-Increment'
    `);
    console.log('✅ Type de test supprimé');
    
    console.log('\n🎉 Vérification terminée avec succès !');
    console.log('✅ La table propertyTypes utilise maintenant l\'auto-increment');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification :', error.message);
    console.error('Stack trace :', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter la vérification
verifyMigration(); 