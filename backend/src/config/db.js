const mysql = require('mysql2');
require('dotenv').config();

const env = (key) => (process.env[key] || '').trim() || null;

// Detect Railway environment
const isRailway = !!(env('RAILWAY_ENVIRONMENT') || env('RAILWAY_SERVICE_NAME') || 
  (env('DB_HOST') && env('DB_HOST').includes('railway')));

// Connection URL takes priority (MYSQL_URL, MYSQL_PRIVATE_URL, DATABASE_URL)
const connectionUrl = env('MYSQL_URL') || env('MYSQL_PRIVATE_URL') || env('DATABASE_URL');

const host     = env('MYSQLHOST')     || env('DB_HOST')     || 'localhost';
const user     = env('MYSQLUSER')     || env('DB_USER')     || 'root';
const password = env('MYSQLPASSWORD') || env('DB_PASSWORD') || '';
const database = env('MYSQLDATABASE') || env('DB_NAME')     || (isRailway ? 'railway' : 'cropshield_db');
const port     = parseInt(env('MYSQLPORT') || env('DB_PORT') || '3306');

function makePool(config) {
  return mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 15000,
  });
}

let pool;

async function initConnection() {
  // Strategy 1: MYSQL_URL connection string
  if (connectionUrl && connectionUrl.startsWith('mysql://')) {
    try {
      const u = new URL(connectionUrl);
      console.log(`[DB] Try MYSQL_URL: ${u.hostname}:${u.port || 3306} db=${u.pathname.slice(1)}`);
    } catch (_) { console.log('[DB] Try MYSQL_URL'); }
    pool = makePool({ uri: connectionUrl });
    try {
      await pool.promise().execute('SELECT 1');
      console.log('[DB] ✅ Connected via MYSQL_URL');
      return pool.promise();
    } catch (err) {
      console.error('[DB] ❌ MYSQL_URL failed:', err.message);
    }
  }

  // Strategy 2: Individual env vars
  const dbName = (isRailway && database === 'cropshield_db') ? 'railway' : database;
  console.log(`[DB] Try env vars: ${host}:${port} db=${dbName} user=${user} isRailway=${isRailway}`);
  pool = makePool({ host, user, password, database: dbName, port });
  try {
    await pool.promise().execute('SELECT 1');
    console.log('[DB] ✅ Connected via env vars');
    return pool.promise();
  } catch (err) {
    console.error('[DB] ❌ Env vars failed:', err.message);
  }

  // Strategy 3: Railway internal hostname (when both services in same project)
  if (isRailway) {
    const fallbacks = [
      { host: 'mysql.railway.internal', port: 3306, database: 'railway', user, password },
      { host: host, port: 3306, database: 'railway', user, password },
    ];
    for (const cfg of fallbacks) {
      console.log(`[DB] Try fallback: ${cfg.host}:${cfg.port} db=${cfg.database}`);
      pool = makePool(cfg);
      try {
        await pool.promise().execute('SELECT 1');
        console.log(`[DB] ✅ Connected via ${cfg.host}`);
        return pool.promise();
      } catch (err) {
        console.error(`[DB] ❌ ${cfg.host} failed:`, err.message);
      }
    }
  }

  console.error('[DB] ❌ ALL connection strategies failed!');
  console.error('[DB] ❌ Add MYSQL_URL to backend Variables in Railway dashboard');
  return pool.promise();
}

const dbReady = initConnection();

// Export a promise-based pool that works immediately for require()
// The pool variable is set synchronously for first strategy, async for fallbacks
if (connectionUrl && connectionUrl.startsWith('mysql://')) {
  pool = makePool({ uri: connectionUrl });
} else {
  const dbName = (isRailway && database === 'cropshield_db') ? 'railway' : database;
  pool = makePool({ host, user, password, database: dbName, port });
}

module.exports = pool.promise();
module.exports.dbReady = dbReady;
