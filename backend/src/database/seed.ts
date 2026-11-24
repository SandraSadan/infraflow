import { pool } from '../config/database.js';

export const seedDemoData = async (): Promise<void> => {
  // Create demo requester and admin identities
  await pool.query(`
    INSERT INTO users (name, email, role)
    VALUES
      ('Demo Requester', 'requester@infraflow.local', 'REQUESTER'),
      ('Demo Admin', 'admin@infraflow.local', 'ADMIN')
    ON CONFLICT (email) DO UPDATE
    SET name = EXCLUDED.name,
        role = EXCLUDED.role
  `);

  // Create or update resource quotas
  await pool.query(`
    INSERT INTO user_quotas (user_id, max_cpu, max_ram, max_disk)
    SELECT id, 8, 16, 200
    FROM users
    WHERE email = 'requester@infraflow.local'
    ON CONFLICT (user_id) DO UPDATE
    SET max_cpu = EXCLUDED.max_cpu,
        max_ram = EXCLUDED.max_ram,
        max_disk = EXCLUDED.max_disk
  `);

  await pool.query(`
    INSERT INTO user_quotas (user_id, max_cpu, max_ram, max_disk)
    SELECT id, 32, 64, 1000
    FROM users
    WHERE email = 'admin@infraflow.local'
    ON CONFLICT (user_id) DO UPDATE
    SET max_cpu = EXCLUDED.max_cpu,
        max_ram = EXCLUDED.max_ram,
        max_disk = EXCLUDED.max_disk
  `);

  console.log('Demo users and resource quotas initialized.');
};
