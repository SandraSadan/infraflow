import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');

    console.log('PostgreSQL connected successfully!');
    console.log('Database server time:', result.rows[0].now);

    return true;
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    return false;
  }
};
