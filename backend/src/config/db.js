const mysql = require('mysql2');
require('dotenv').config();

// Helper: trim whitespace/newlines from env vars (common Railway dashboard paste issue)
const env = (key) => (process.env[key] || '').trim() || null;

// Railway auto-injects MYSQL* vars when a MySQL service is linked.
// Prioritize those over local .env DB_* vars so Railway works out of the box.
const host     = env('MYSQLHOST')     || env('DB_HOST')     || 'localhost';
const user     = env('MYSQLUSER')     || env('DB_USER')     || 'root';
const password = env('MYSQLPASSWORD') || env('DB_PASSWORD') || '';
const database = env('MYSQLDATABASE') || env('DB_NAME')     || 'cropshield_db';
const port     = parseInt(env('MYSQLPORT') || env('DB_PORT') || '3306');

// Also support MYSQL_URL / DATABASE_URL connection string (Railway provides this too)
const connectionUrl = env('MYSQL_URL') || env('DATABASE_URL');

let pool;
if (connectionUrl && connectionUrl.startsWith('mysql://')) {
  console.log(`[DB] Using connection URL (MYSQL_URL)`);
  pool = mysql.createPool(connectionUrl);
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

// Test connection on startup
pool.promise().execute('SELECT 1').then(() => {
  console.log('[DB] ✅ Database connection verified successfully');
}).catch((err) => {
  console.error('[DB] ❌ Database connection FAILED:', err.message);
  console.error('[DB] ❌ Check that MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT are set correctly');
  console.error('[DB] Current config: host=' + host + ' port=' + port + ' user=' + user + ' db=' + database);
});

module.exports = pool.promise();
