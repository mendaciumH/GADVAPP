import { Client } from 'pg';
import { AppDataSource } from './data-source';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export async function createDatabaseIfNotExists() {

  const options = AppDataSource.options as PostgresConnectionOptions;

  const client = new Client({
    host: options.host,
    port: options.port,
    user: options.username,  
    password: options.password,
    database: options.database, 
  });
  
  try {
    await client.connect();    
    // Vérifier si la base de données existe
    const dbName = options.database || 'gestionadv_db';
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rowCount === 0) {
      // Créer la base de données si elle n'existe pas
      await client.query(`CREATE DATABASE "${dbName}"`);
    } 
  } catch (error) {
    console.error('Erreur lors de la création de la base de données:', error);
    throw error;
  } finally {
    await client.end();
  }
} 