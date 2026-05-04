const mysql = require('mysql2/promise');
const db = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '3Nkwm2fKtuGqoiu.root',
  password: '6sXYNlDhrX80xnDz',
  database: 'test',
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
};

(async () => {
  const c = await mysql.createConnection(db);

  console.log('===== PROOF 2: CLEANUP RESIDUE (DETAILED) =====\n');

  // 1. Asset declarations with test-pattern financial years (< 2000)
  const [[{ decl_test_years }]] = await c.execute(`
    SELECT COUNT(*) AS decl_test_years
    FROM asset_declarations
    WHERE financial_year REGEXP '^[0-9]{3,4}-[0-9]{2}$'
      AND CAST(SUBSTRING_INDEX(financial_year, '-', 1) AS UNSIGNED) < 2000
  `);

  // 2. Temples created in last 24h with test-pattern names
  const [[{ temples_24h }]] = await c.execute(`
    SELECT COUNT(*) AS temples_24h FROM temples
    WHERE created_at >= NOW() - INTERVAL 24 HOUR
  `);

  // 3. Trusts created last 24h
  const [[{ trusts_24h }]] = await c.execute(`
    SELECT COUNT(*) AS trusts_24h FROM trusts
    WHERE created_at >= NOW() - INTERVAL 24 HOUR
  `);

  // 4. Workflow instances last 24h
  const [[{ wi_24h }]] = await c.execute(`
    SELECT COUNT(*) AS wi_24h FROM workflow_instances
    WHERE created_at >= NOW() - INTERVAL 24 HOUR
  `);

  // 5. Workflow transitions last 24h
  const [[{ wt_24h }]] = await c.execute(`
    SELECT COUNT(*) AS wt_24h FROM workflow_transitions
    WHERE performed_at >= NOW() - INTERVAL 24 HOUR
  `);

  // 6. Notification outbox last 24h
  const [[{ notif_out_24h }]] = await c.execute(`
    SELECT COUNT(*) AS notif_out_24h FROM notification_outbox
    WHERE created_at >= NOW() - INTERVAL 24 HOUR
  `);

  // 7. In-app notifications last 24h
  const [[{ in_app_24h }]] = await c.execute(`
    SELECT COUNT(*) AS in_app_24h FROM in_app_notifications
    WHERE created_at >= NOW() - INTERVAL 24 HOUR
  `);

  // 8. GAH last 24h
  const [[{ gah_24h }]] = await c.execute(`
    SELECT COUNT(*) AS gah_24h FROM governance_action_history
    WHERE timestamp >= NOW() - INTERVAL 24 HOUR
  `);

  // 9. Board members last 24h
  const [[{ bm_24h }]] = await c.execute(`
    SELECT COUNT(*) AS bm_24h FROM board_members
    WHERE created_at >= NOW() - INTERVAL 24 HOUR
  `);

  // 10. Show distinct financial_year values for test-pattern declarations
  const [fy_rows] = await c.execute(`
    SELECT financial_year, status, submission_status, COUNT(*) AS cnt
    FROM asset_declarations
    WHERE financial_year REGEXP '^[0-9]{3,4}-[0-9]{2}$'
      AND CAST(SUBSTRING_INDEX(financial_year, '-', 1) AS UNSIGNED) < 2000
    GROUP BY financial_year, status, submission_status
    ORDER BY financial_year DESC
  `);

  const residue = [
    { table: 'asset_declarations (test-year)', count: decl_test_years, target: 0, status: decl_test_years == 0 ? 'PASS' : 'FAIL_RESIDUE' },
    { table: 'temples (last 24h)', count: temples_24h, target: 0, status: temples_24h == 0 ? 'PASS' : 'INFO' },
    { table: 'trusts (last 24h)', count: trusts_24h, target: 0, status: trusts_24h == 0 ? 'PASS' : 'INFO' },
    { table: 'workflow_instances (last 24h)', count: wi_24h, target: 0, status: wi_24h == 0 ? 'PASS' : 'INFO' },
    { table: 'workflow_transitions (last 24h)', count: wt_24h, target: 0, status: wt_24h == 0 ? 'PASS' : 'INFO' },
    { table: 'notification_outbox (last 24h)', count: notif_out_24h, target: 0, status: notif_out_24h == 0 ? 'PASS' : 'INFO' },
    { table: 'in_app_notifications (last 24h)', count: in_app_24h, target: 0, status: in_app_24h == 0 ? 'PASS' : 'INFO' },
    { table: 'governance_action_history (last 24h)', count: gah_24h, target: 0, status: gah_24h == 0 ? 'PASS' : 'INFO' },
    { table: 'board_members (last 24h)', count: bm_24h, target: 0, status: bm_24h == 0 ? 'PASS' : 'INFO' },
  ];
  console.table(residue);

  if (fy_rows.length > 0) {
    console.log('\nTest-year declarations detail:');
    console.table(fy_rows);
  }

  // 11. Structural gap: does test_run_id column exist in cleanup target tables?
  console.log('\n===== PROOF 2b: CLEANUP MECHANISM STRUCTURAL AUDIT =====');
  const cleanupTables = ['asset_declarations', 'temples', 'trusts', 'board_members', 'workflow_instances', 'notification_outbox', 'in_app_notifications'];
  const [colRows] = await c.execute(`
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'test'
      AND column_name = 'test_run_id'
      AND table_name IN ('asset_declarations','temples','trusts','board_members','workflow_instances','notification_outbox','in_app_notifications')
    ORDER BY table_name
  `);
  const hasColumn = new Set(colRows.map(r => r.table_name));
  const structAudit = cleanupTables.map(t => ({
    table: t,
    has_test_run_id: hasColumn.has(t) ? 'YES' : 'NO',
    cleanup_works: hasColumn.has(t) ? 'YES' : 'NO - DELETE silently skipped (wrong table name or missing column)',
  }));
  console.table(structAudit);

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
