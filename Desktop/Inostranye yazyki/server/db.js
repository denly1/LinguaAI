const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'InostranDB1',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '1',
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected: InostranDB1');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
  });

module.exports = pool;
