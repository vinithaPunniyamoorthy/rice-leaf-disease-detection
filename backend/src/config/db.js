const mysql = require('mysql2');
require('dotenv').config();

const env = (key) => (process.env[key] || '').trim() || null;

// Railway injects MYSQL_URL, MYSQL_PRIVATE_URL, DATABASE_URL, or individual MYSQL* vars
const connectionUrl = env('MYSQL_URL') || env('MYSQL_PRIVATE_URL') || env('DATABASE_URL');

const host     = env('MYSQLHOST')     || env('DB_HOST')     || 'localhost';
const user     = env('MYSQLUSER')     || env('DB_USER')     || 'root';
const password = env('MYSQLPASSWORD') || env('DB_PASSWORD') || '';
const database = env('MYSQLDATABASE') || env('DB_NAME')     || 'railway';
const port     = parseInt(env('MYSQLPORT') || env('DB_PORT') || '3306');

let pool;
if (connectionUrl && connectionUrl.startsWith('mysql://')) {
  // Parse URL to log host info (mask password)
  try {
    const u = new URL(connectionUrl);
    console.log(`[DB] Using connection URL → ${u.hostname}:${u.port || 3306} (db: ${u.pathname.slice(1)}, user: ${u.username})`);
  } catch (_) {
    console.log(`[DB] Using connection URL (MYSQL_URL)`);
  }
  pool = mysql.createPool({
    uri: connectionUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
  });
} else {
  console.log(`[DB] Connecting to MySQL at ${host}:${port} (db: ${database}, user: ${user})`);
  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
  });
}

// Test connection on startup with retry
async function testConnection(retries = 3) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.promise().execute('SELECT 1');
      console.log('[DB] ✅ Database connection verified successfully');
      return;
    } catch (err) {
      console.error(`[DB] ❌ Connection attempt ${i}/${retries} FAILED: ${err.message}`);
      if (i < retries) {
        console.log(`[DB] Retrying in ${i * 2}s...`);
        await new Promise(r => setTimeout(r, i * 2000));
      }
    }
  }
  console.error('[DB] ❌ All connection attempts failed.');
  console.error('[DB] ❌ Env check: MYSQL_URL=' + (env('MYSQL_URL') ? 'SET' : 'NOT SET') +
    ', MYSQLHOST=' + (env('MYSQLHOST') || 'NOT SET') +
    ', DB_HOST=' + (env('DB_HOST') || 'NOT SET'));
}
testConnection();

module.exports = pool.promise();
