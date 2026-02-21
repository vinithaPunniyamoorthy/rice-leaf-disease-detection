const mysql = require('mysql2');
require('dotenv').config();

const env = (key) => (process.env[key] || '').trim() || null;

// Detect Railway environment
const isRailway = !!(env('RAILWAY_ENVIRONMENT') || env('RAILWAY_SERVICE_NAME') || 
  (env('DB_HOST') && env('DB_HOST').includes('railway')));

// Connection URL takes priority
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

// Shared pool reference
let activePool = null;

async function tryConnect(label, config) {
  const p = makePool(config);
  try {
    await p.promise().execute('SELECT 1');
    console.log(`[DB] ✅ ${label}: Connected!`);
    activePool = p;
    return true;
  } catch (err) {
    console.error(`[DB] ❌ ${label}: ${err.message}`);
    try { p.end(); } catch (_) {}
    return false;
  }
}

async function initConnection() {
  console.log(`[DB] isRailway=${isRailway}, host=${host}, port=${port}, db=${database}`);

  // Strategy 1: MYSQL_URL env var
  if (connectionUrl && connectionUrl.startsWith('mysql://')) {
    try {
      const u = new URL(connectionUrl);
      console.log(`[DB] S1: MYSQL_URL → ${u.hostname}:${u.port || 3306}/${u.pathname.slice(1)}`);
    } catch (_) {}
    if (await tryConnect('MYSQL_URL', { uri: connectionUrl })) return;
  }

  // Strategy 2: Individual env vars
  const dbName = (isRailway && database === 'cropshield_db') ? 'railway' : database;
  console.log(`[DB] S2: ${host}:${port} db=${dbName}`);
  if (await tryConnect('EnvVars', { host, user, password, database: dbName, port })) return;

  // Strategy 3: Railway-specific fallbacks
  if (isRailway) {
    const fallbackConfigs = [
      // Try Railway internal hostname
      { label: 'Railway-internal', host: 'mysql.railway.internal', port: 3306, database: 'railway', user, password },
      // Try Railway public proxy
      { label: 'Railway-proxy', host: 'mainline.proxy.rlwy.net', port: 20054, database: 'railway', user, password },
      // Try known Railway MySQL URL (hardcoded fallback for this project)
      { label: 'Railway-direct', uri: 'mysql://root:wNWbjMnBsZKjTxKDyySvmeTPXTYatNoL@mysql.railway.internal:3306/railway' },
      { label: 'Railway-public', uri: 'mysql://root:wNWbjMnBsZKjTxKDyySvmeTPXTYatNoL@mainline.proxy.rlwy.net:20054/railway' },
    ];
    for (const s of fallbackConfigs) {
      console.log(`[DB] S3: ${s.label}`);
      const config = s.uri ? { uri: s.uri } : { host: s.host, port: s.port, database: s.database, user: s.user, password: s.password };
      if (await tryConnect(s.label, config)) return;
    }
  }

  console.error('[DB] ❌ ALL strategies failed!');
}

// Create initial sync pool
if (connectionUrl && connectionUrl.startsWith('mysql://')) {
  activePool = makePool({ uri: connectionUrl });
} else if (isRailway) {
  // On Railway, default to internal hostname
  activePool = makePool({ uri: 'mysql://root:wNWbjMnBsZKjTxKDyySvmeTPXTYatNoL@mysql.railway.internal:3306/railway' });
} else {
  activePool = makePool({ host, user, password, database, port });
}

// Run async init to find best working connection
const dbReady = initConnection().catch(err => console.error('[DB] Init error:', err.message));

// Proxy: always delegates to activePool
const handler = {
  get(_, prop) {
    if (!activePool) throw new Error('Database pool not initialized');
    const target = activePool.promise();
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  }
};

module.exports = new Proxy({}, handler);
module.exports.dbReady = dbReady;
