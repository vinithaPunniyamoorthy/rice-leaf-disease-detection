const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema_v2.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL');
        await connection.query(sql);
        console.log('✅ Database schema V2 applied successfully');
        await connection.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
