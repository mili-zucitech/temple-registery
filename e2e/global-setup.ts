import { DbClient } from './lib/db-client';

async function globalSetup() {
  console.log('🔧 Global Setup: Initializing test database...');

  const db = new DbClient({
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.DB_PORT || '4000'),
    user: process.env.DB_USER || '3Nkwm2fKtuGqoiu.root',
    password: process.env.DB_PASSWORD || '6sXYNlDhrX80xnDz',
    database: process.env.DB_NAME || 'test'
  });

  await db.connect();

  // Deterministic readiness check: verify DB/session connectivity used by tests.
  await db.execute('SELECT 1 AS ready');

  // Sanity-read fixture principals used by smoke tests.
  await db.execute(
    "SELECT username, role FROM users WHERE username IN ('ta_chamundi','dc_mysuru','super_admin')"
  );

  await db.disconnect();
  console.log('✅ Global Setup Complete');
}

export default globalSetup;
