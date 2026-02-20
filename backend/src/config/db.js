const mysql = require('mysql2');
require('dotenv').config();

// Railway auto-injects MYSQL* vars when a MySQL service is linked.
// Prioritize those over local .env DB_* vars so Railway works out of the box.
const host     = process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost';
const user     = process.env.MYSQLUSER     || process.env.DB_USER     || 'root';
const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
const database = process.env.MYSQLDATABASE || process.env.DB_NAME     || 'cropshield_db';
const port     = parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306');

// Also support MYSQL_URL / DATABASE_URL connection string (Railway provides this too)
const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || null;

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
