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

  // Breakdown of missing rows by action+role
  const [r1] = await c.execute(`
    SELECT wt.action, wt.actor_role, COUNT(*) AS cnt
    FROM workflow_transitions wt
    LEFT JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
    WHERE wt.action NOT LIKE 'SYSTEM_%' AND gah.id IS NULL
    GROUP BY wt.action, wt.actor_role
    ORDER BY cnt DESC
  `);
  console.log('Missing audit rows by action+role:');
  console.table(r1);

  // Check APPROVE transitions - do they have GAH via entity but not wt FK?
  const [r2] = await c.execute(`
    SELECT wt.id AS wt_id, wt.action, wt.workflow_instance_id,
           wi.entity_type, wi.entity_id,
           gah2.id AS gah_by_instance,
           gah2.action AS gah_action
    FROM workflow_transitions wt
    JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
    LEFT JOIN governance_action_history gah ON gah.workflow_transition_id = wt.id
    LEFT JOIN governance_action_history gah2 ON gah2.workflow_instance_id = wt.workflow_instance_id
      AND gah2.action = wt.action
    WHERE wt.action NOT LIKE 'SYSTEM_%'
      AND gah.id IS NULL
      AND wt.action = 'APPROVE'
    ORDER BY wt.id DESC
    LIMIT 5
  `);
  console.log('\nMissing APPROVE transitions - checking if GAH exists via workflow_instance_id:');
  console.table(r2);

  // Check if GAH rows exist linked by entity_id for the same instances
  const [r3] = await c.execute(`
    SELECT wt.id AS wt_id, wt.action, wi.entity_id, COUNT(gah.id) AS gah_count_for_entity
    FROM workflow_transitions wt
    JOIN workflow_instances wi ON wi.id = wt.workflow_instance_id
    LEFT JOIN governance_action_history gah ON gah.entity_id = wi.entity_id
      AND gah.action = wt.action
    LEFT JOIN governance_action_history gah_direct ON gah_direct.workflow_transition_id = wt.id
    WHERE wt.action NOT LIKE 'SYSTEM_%'
      AND gah_direct.id IS NULL
    GROUP BY wt.id, wt.action, wi.entity_id
    HAVING gah_count_for_entity > 0
    ORDER BY wt.id DESC
    LIMIT 5
  `);
  console.log('\nMissing direct FK - but GAH exists by entity_id match:');
  console.table(r3);

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
