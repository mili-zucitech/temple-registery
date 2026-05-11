const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com', port: 4000,
    user: '3Nkwm2fKtuGqoiu.root', password: '6sXYNlDhrX80xnDz', database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
  });
  const [tables] = await conn.query('SHOW TABLES');
  console.log(JSON.stringify(tables.map(r => Object.values(r)[0])));
  await conn.end();
})().catch(console.error);
