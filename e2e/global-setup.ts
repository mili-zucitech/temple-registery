import { DbClient } from './lib/db-client';
import { env } from './setup/env';

async function globalSetup() {
  console.log('🔧 Global Setup: Initializing test database...');

  const db = new DbClient(env.db);

  await db.connect();

  // Deterministic readiness check: verify DB/session connectivity used by tests.
  await db.execute('SELECT 1 AS ready');

  // Sanity-read fixture principals used by smoke tests.
  await db.execute(
    'SELECT username, role FROM users WHERE username IN (?, ?, ?)',
    [env.roles.TA.username, env.roles.DC.username, env.roles.SA.username]
  );

  await db.disconnect();
  console.log('✅ Global Setup Complete');
}

export default globalSetup;
