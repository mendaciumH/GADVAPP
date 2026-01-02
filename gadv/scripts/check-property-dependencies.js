#!/usr/bin/env node

/**
 * Script de vérification des dépendances entre properties et propertyTypes
 * 
 * Ce script vérifie quelles propriétés utilisent quels types avant la migration
 */

const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'gestionadv_db'
});

async function checkDependencies() {
  try {
    await client.connect();
    
  //  console.log('✅ Connexion réussie !');
    
    // 1. Vérifier l'existence des tables
   // console.log('\n📋 Vérification de l\'existence des tables...');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('properties', 'propertyTypes')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ Aucune des tables n\'existe');
      return;
    }
    
    console.log('Tables trouvées :');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // 2. Vérifier la structure de propertyTypes
    console.log('\n🏗️ Structure de la table propertyTypes...');
    try {
      const propertyTypesStructure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'propertyTypes' 
        ORDER BY ordinal_position
      `);
      
      console.log('Structure de propertyTypes :');
      propertyTypesStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } catch (error) {
      console.log('⚠️ Impossible de lire la structure de propertyTypes');
    }
    
    // 3. Vérifier la structure de properties
    console.log('\n🏠 Structure de la table properties...');
    try {
      const propertiesStructure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        ORDER BY ordinal_position
      `);
      
      console.log('Structure de properties :');
      propertiesStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } catch (error) {
      console.log('⚠️ Impossible de lire la structure de properties');
    }
    
    // 4. Vérifier les contraintes de clés étrangères
    console.log('\n🔗 Vérification des contraintes de clés étrangères...');
    try {
      const constraintsResult = await client.query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'properties' OR ccu.table_name = 'propertyTypes')
      `);
      
      if (constraintsResult.rows.length > 0) {
        console.log('Contraintes de clés étrangères trouvées :');
        constraintsResult.rows.forEach(row => {
          console.log(`  - ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
        });
      } else {
        console.log('⚠️ Aucune contrainte de clé étrangère trouvée');
      }
    } catch (error) {
      console.log('⚠️ Impossible de vérifier les contraintes');
    }
    
    // 5. Vérifier les données existantes
    console.log('\n📊 Données existantes dans propertyTypes...');
    try {
      const propertyTypesData = await client.query(`
        SELECT id, name FROM "propertyTypes" ORDER BY id
      `);
      
      if (propertyTypesData.rows.length > 0) {
        console.log('Types de propriétés existants :');
        propertyTypesData.rows.forEach(row => {
          console.log(`  - ID: ${row.id}, Nom: ${row.name}`);
        });
      } else {
        console.log('❌ Aucun type de propriété trouvé');
      }
    } catch (error) {
      console.log('⚠️ Impossible de lire les données de propertyTypes');
    }
    
    // 6. Vérifier les propriétés qui utilisent ces types
    console.log('\n🏠 Propriétés utilisant ces types...');
    try {
      const propertiesData = await client.query(`
        SELECT p.id, p.propertyType, pt.name as type_name
        FROM properties p
        LEFT JOIN "propertyTypes" pt ON p.propertyType = pt.id
        ORDER BY p.propertyType, p.id
      `);
      
      if (propertiesData.rows.length > 0) {
        console.log('Propriétés et leurs types :');
        const groupedByType = {};
        propertiesData.rows.forEach(row => {
          const typeId = row.propertyType || 'NULL';
          if (!groupedByType[typeId]) {
            groupedByType[typeId] = [];
          }
          groupedByType[typeId].push(row.id);
        });
        
        Object.keys(groupedByType).forEach(typeId => {
          const typeName = propertiesData.rows.find(r => r.propertyType == typeId)?.type_name || 'Type inconnu';
          console.log(`  - Type ${typeId} (${typeName}): ${groupedByType[typeId].length} propriété(s) - IDs: ${groupedByType[typeId].join(', ')}`);
        });
      } else {
        console.log('❌ Aucune propriété trouvée');
      }
    } catch (error) {
      console.log('⚠️ Impossible de lire les données de properties');
    }
    
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification :', error.message);
    if (error.code) {
      console.error('Code d\'erreur PostgreSQL :', error.code);
    }
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Connexion fermée');
    } catch (closeError) {
      console.log('⚠️ Erreur lors de la fermeture de la connexion');
    }
  }
}

// Exécuter la vérification
checkDependencies(); 