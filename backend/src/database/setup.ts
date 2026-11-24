
import { readFile } from 'node:fs/promises';
import { pool } from '../config/database.js';
import { seedDemoData } from './seed.js';

const setupDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing InfraFlow database...');

    // Read and execute the database schema
    const schema = await readFile(
      new URL('./schema.sql', import.meta.url),
      'utf-8'
    );

    await pool.query(schema);

    console.log('Database tables created successfully.');

    // Insert demo identities and quotas
    await seedDemoData();

    console.log('InfraFlow database setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

setupDatabase();
