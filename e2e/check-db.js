const mysql = require('mysql2/promise');
mysql.createConnection({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com', port: 4000,
  user: '3Nkwm2fKtuGqoiu.root', password: '6sXYNlDhrX80xnDz', database: 'test',
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
}).then(async conn => {
  const [c] = await conn.query('SHOW COLUMNS FROM trusts');
  console.log('trusts columns:', c.map(r => r.Field));
  const [dc] = await conn.query("SELECT username, id FROM users WHERE username LIKE 'dc%'");
  console.log('DC users:', JSON.stringify(dc));
  await conn.end();
}).catch(console.error);
