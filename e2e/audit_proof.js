const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '3Nkwm2fKtuGqoiu.root',
  password: '6sXYNlDhrX80xnDz',
  database: 'test',
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
};

async function run() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('Connected to TiDB.\n');

  // ===== PROOF 1: AUDIT CONSISTENCY =====
  const [[{ total_auditable }]] = await conn.execute(
    "SELECT COUNT(*) AS total_auditable FROM workflow_transitions WHERE action NOT LIKE 'SYSTEM_%'"
  );
  const [[{ total_gah_linked }]] = await conn.execute(
    "SELECT COUNT(*) AS total_gah_linked FROM governance_action_history WHERE workflow_transition_id IS NOT NULL"
  );
  const [[{ total_gah_all }]] = await conn.execute(
    "SELECT COUNT(*) AS total_gah_all FROM governance_action_history"
  );
  const [[{ missing }]] = await conn.execute(`
    SELECT COUNT(*) AS missing
    FROM workflow_transitions wt
    LEFT JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
    WHERE wt.action NOT LIKE 'SYSTEM_%' AND gah.id IS NULL
  `);
  const [[{ extra }]] = await conn.execute(`
    SELECT COUNT(*) AS extra
    FROM governance_action_history gah
    LEFT JOIN workflow_transitions wt ON wt.id = gah.workflow_transition_id
    WHERE wt.id IS NULL AND gah.workflow_transition_id IS NOT NULL
  `);
  const [[{ mismatch }]] = await conn.execute(`
    SELECT COUNT(*) AS mismatch
    FROM workflow_transitions wt
    JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
    WHERE UPPER(wt.action) != UPPER(gah.action) AND wt.action NOT LIKE 'SYSTEM_%'
  `);

  console.log('===== PROOF 1: AUDIT CONSISTENCY =====');
  console.log(`total_auditable_transitions : ${total_auditable}`);
  console.log(`total_gah_all_rows          : ${total_gah_all}`);
  console.log(`total_gah_linked_to_trans   : ${total_gah_linked}`);
  console.log(`missing_audit_rows          : ${missing}  <- TARGET: 0`);
  console.log(`extra_audit_rows            : ${extra}  <- TARGET: 0`);
  console.log(`action_mismatch_rows        : ${mismatch}  <- TARGET: 0`);

  if (Number(missing) > 0) {
    const [rows] = await conn.execute(`
      SELECT wt.id, wt.workflow_instance_id, wt.action, wt.from_status, wt.to_status,
             DATE_FORMAT(wt.performed_at, '%Y-%m-%d %H:%i:%s') AS performed_at
      FROM workflow_transitions wt
      LEFT JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
      WHERE wt.action NOT LIKE 'SYSTEM_%' AND gah.id IS NULL
      ORDER BY wt.id DESC LIMIT 5
    `);
    console.log('\nSAMPLE MISSING ROWS:');
    console.table(rows);
  }

  if (Number(extra) > 0) {
    const [rows] = await conn.execute(`
      SELECT gah.id, gah.workflow_instance_id, gah.workflow_transition_id, gah.action,
             DATE_FORMAT(gah.timestamp, '%Y-%m-%d %H:%i:%s') AS ts
      FROM governance_action_history gah
      LEFT JOIN workflow_transitions wt ON wt.id = gah.workflow_transition_id
      WHERE wt.id IS NULL AND gah.workflow_transition_id IS NOT NULL
      ORDER BY gah.id DESC LIMIT 5
    `);
    console.log('\nSAMPLE EXTRA GAH ROWS:');
    console.table(rows);
  }

  // ===== PROOF 2: CLEANUP RESIDUE =====
  console.log('\n===== PROOF 2: CLEANUP RESIDUE =====');
  console.log('NOTE: No test_run_id column in production tables. Checking via test-pattern financial_years (< year 2000) and recent 24h activity.\n');

  const tables = [
    ['asset_declarations', "financial_year REGEXP '^[0-9]{3,4}-[0-9]{2}$' AND CAST(SUBSTRING_INDEX(financial_year,'-',1) AS UNSIGNED) < 2000"],
    ['temples', "created_at >= NOW() - INTERVAL 24 HOUR AND name LIKE 'Test%'"],
    ['trusts', "created_at >= NOW() - INTERVAL 24 HOUR AND name LIKE 'Test%'"],
    ['workflow_instances', "created_at >= NOW() - INTERVAL 24 HOUR"],
    ['notification_outbox', "created_at >= NOW() - INTERVAL 24 HOUR"],
    ['in_app_notifications', "created_at >= NOW() - INTERVAL 24 HOUR"],
    ['governance_action_history', "timestamp >= NOW() - INTERVAL 24 HOUR"],
    ['workflow_transitions', "performed_at >= NOW() - INTERVAL 24 HOUR"],
  ];

  const residueResults = [];
  for (const [table, where] of tables) {
    try {
      const [[{ cnt }]] = await conn.execute(`SELECT COUNT(*) AS cnt FROM ${table} WHERE ${where}`);
      residueResults.push({ table, count: cnt, note: 'OK' });
    } catch (e) {
      residueResults.push({ table, count: 'ERR', note: e.message.slice(0, 80) });
    }
  }
  console.table(residueResults);

  // Recent test asset_declarations (sample)
  const [recentDecls] = await conn.execute(`
    SELECT id, temple_id, financial_year, status, submission_status,
           DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM asset_declarations
    WHERE financial_year REGEXP '^[0-9]{3,4}-[0-9]{2}$'
      AND CAST(SUBSTRING_INDEX(financial_year,'-',1) AS UNSIGNED) < 2000
    ORDER BY id DESC LIMIT 10
  `);
  if (recentDecls.length > 0) {
    console.log('\nRESIDUE SAMPLE (test-year declarations):');
    console.table(recentDecls);
  } else {
    console.log('\nNo residue declarations with test-pattern financial years found.');
  }

  await conn.end();
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
