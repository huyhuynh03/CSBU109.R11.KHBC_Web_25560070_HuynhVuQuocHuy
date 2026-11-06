const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};
const dbName = process.env.DB_NAME || 'ecommerce_order_db';

(async () => {
  const connection = await mysql.createConnection(config);
  try {
    if (process.argv.includes('--reset')) {
      await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    }
    const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
    for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
      await connection.query(statement);
    }
    console.log(`Database ${dbName} and all tables are ready.`);
  } finally {
    await connection.end();
  }
})().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
});
