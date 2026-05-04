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
    const sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND (table_name LIKE '%district%' OR table_name LIKE '%taluk%' OR table_name LIKE '%hobli%') ORDER BY table_name";
    const [rows] = await conn.query(sql);
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
