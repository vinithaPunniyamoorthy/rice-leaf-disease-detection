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
    connectTimeout: 10000,
  });
}

// Shared pool reference — updated when a working connection is found
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

  // Strategy 1: MYSQL_URL
  if (connectionUrl && connectionUrl.startsWith('mysql://')) {
    try {
      const u = new URL(connectionUrl);
      console.log(`[DB] S1: MYSQL_URL → ${u.hostname}:${u.port || 3306}/${u.pathname.slice(1)}`);
    } catch (_) {}
    if (await tryConnect('MYSQL_URL', { uri: connectionUrl })) return;
  }

  // Strategy 2: Individual env vars (correct db name for Railway)
  const dbName = (isRailway && database === 'cropshield_db') ? 'railway' : database;
  console.log(`[DB] S2: ${host}:${port} db=${dbName}`);
  if (await tryConnect('EnvVars', { host, user, password, database: dbName, port })) return;

  // Strategy 3: Railway fallbacks
  if (isRailway) {
    const strategies = [
      { label: 'Railway-internal', host: 'mysql.railway.internal', port: 3306, database: 'railway', user, password },
      { label: 'Railway-proxy', host: 'mainline.proxy.rlwy.net', port: 20054, database: 'railway', user, password },
      { label: 'Railway-host-fix', host, port: 20054, database: 'railway', user, password },
    ];
    for (const s of strategies) {
      console.log(`[DB] S3: ${s.label} → ${s.host}:${s.port}`);
      if (await tryConnect(s.label, { host: s.host, port: s.port, database: s.database, user: s.user, password: s.password })) return;
    }
  }

  console.error('[DB] ❌ ALL strategies failed. Set MYSQL_URL on Railway backend Variables.');
}

// Create initial pool synchronously (so require() works immediately)
if (connectionUrl && connectionUrl.startsWith('mysql://')) {
  activePool = makePool({ uri: connectionUrl });
} else {
  const dbName = (isRailway && database === 'cropshield_db') ? 'railway' : database;
  activePool = makePool({ host, user, password, database: dbName, port });
}

// Run async init to find best connection (replaces activePool if better found)
const dbReady = initConnection().catch(err => console.error('[DB] Init error:', err.message));

// Proxy module: always delegates to activePool (updated by initConnection)
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
