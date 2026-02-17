const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    const schemaPath = path.join(__dirname, 'database', 'schema_v3.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cropshield_db', // Ensure we select the DB
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL');
        await connection.query(sql);
        console.log('✅ Database schema V3 (EmailVerifications) applied successfully');
        await connection.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
