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
    const [districts] = await conn.query('SELECT id FROM districts ORDER BY id LIMIT 5');
    const [taluks] = await conn.query('SELECT id, district_id FROM taluks ORDER BY id LIMIT 5');
    const [hoblis] = await conn.query('SELECT id, taluk_id FROM hoblis ORDER BY id LIMIT 5');

    console.log('districts (first 5 ids):');
    console.log(JSON.stringify(districts, null, 2));
    console.log('taluks (first 5 ids with district_id):');
    console.log(JSON.stringify(taluks, null, 2));
    console.log('hoblis (first 5 ids with taluk_id):');
    console.log(JSON.stringify(hoblis, null, 2));
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
