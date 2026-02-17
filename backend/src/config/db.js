const mysql = require('mysql2');
require('dotenv').config();

// Support both Railway's MYSQL_* vars and custom DB_* vars
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'cropshield_db',
  port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log(`[DB] Connecting to MySQL at ${process.env.DB_HOST || process.env.MYSQLHOST || 'localhost'}:${process.env.DB_PORT || process.env.MYSQLPORT || '3306'}`);

module.exports = pool.promise();
