const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com', port: 4000,
    user: '3Nkwm2fKtuGqoiu.root', password: '6sXYNlDhrX80xnDz', database: 'test',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
  });
  const [tables] = await conn.query('SHOW TABLES LIKE "%trust%"');
  console.log(JSON.stringify(tables));
  const [decl] = await conn.query('SHOW TABLES LIKE "%declar%"');
  console.log(JSON.stringify(decl));
  await conn.end();
})().catch(console.error);
