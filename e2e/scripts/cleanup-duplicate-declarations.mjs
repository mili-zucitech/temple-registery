import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
});

const [dups] = await conn.query(`
  SELECT temple_id, financial_year, GROUP_CONCAT(id ORDER BY id) ids, COUNT(*) cnt
  FROM asset_declarations
  GROUP BY temple_id, financial_year
  HAVING COUNT(*) > 1
`);
console.log('Duplicate (temple, fy) groups:', dups);

// For each duplicate group, delete all but the lowest id (and its dependent workflow rows).
for (const dup of dups) {
  const ids = String(dup.ids).split(',').map(Number);
  const keep = ids[0];
  const toDelete = ids.slice(1);
  console.log(`temple_id=${dup.temple_id} fy=${dup.financial_year}: keep ${keep}, delete ${toDelete.join(',')}`);

  // Find workflow_instances tied to the doomed declarations
  const placeholders = toDelete.map(() => '?').join(',');
  const [wis] = await conn.query(
    `SELECT id FROM workflow_instances WHERE entity_type='DECLARATION' AND entity_id IN (${placeholders})`,
    toDelete,
  );
  const wiIds = wis.map((r) => r.id);

  if (wiIds.length > 0) {
    const wiPh = wiIds.map(() => '?').join(',');
    const childTables = [
      'entity_versions',
      'workflow_idempotency_records',
      'in_app_notifications',
      'notification_outbox',
      'governance_action_history',
      'workflow_transitions',
      'clarification_messages',
      'clarification_threads',
    ];
    for (const t of childTables) {
      try {
        const [r] = await conn.query(`DELETE FROM ${t} WHERE workflow_instance_id IN (${wiPh})`, wiIds);
        if (r.affectedRows) console.log(`  ${t}: ${r.affectedRows}`);
      } catch (e) {
        // table may not have workflow_instance_id column or may not exist
      }
    }
    await conn.query(`DELETE FROM workflow_instances WHERE id IN (${wiPh})`, wiIds);
  }

  await conn.query(`DELETE FROM asset_declarations WHERE id IN (${placeholders})`, toDelete);
  console.log(`  removed ${toDelete.length} declaration(s)`);
}

await conn.end();
console.log('Done.');
