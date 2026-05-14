const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.DB_PORT || '4000', 10),
    user: process.env.DB_USER || '3Nkwm2fKtuGqoiu.root',
    password: process.env.DB_PASSWORD || '6sXYNlDhrX80xnDz',
    database: process.env.DB_NAME || 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
  });

  try {
    const [latest] = await conn.query("SELECT id FROM workflow_instances WHERE entity_type='DECLARATION' ORDER BY id DESC LIMIT 1");
    if (!latest.length) {
      console.log('No DECLARATION workflow_instances found.');
      return;
    }

    const workflowInstanceId = latest[0].id;
    console.log('Latest DECLARATION workflow_instance_id:', workflowInstanceId);

    const [transitions] = await conn.query(
      'SELECT id, action, to_status, created_at FROM workflow_transitions WHERE workflow_instance_id=? ORDER BY id DESC',
      [workflowInstanceId]
    );
    console.log('\nworkflow_transitions:');
    console.table(transitions);

    const [history] = await conn.query(
      'SELECT id, action, dc_user_id, timestamp FROM governance_action_history WHERE workflow_instance_id=? ORDER BY id DESC',
      [workflowInstanceId]
    );
    console.log('\ngovernance_action_history:');
    console.table(history);
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
