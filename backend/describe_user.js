const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cropshield_db_v2'
        });

        console.log('✅ Connected to MySQL');

        const [rows] = await connection.query('DESCRIBE User');
        console.log('User Table Schema:', rows);

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkSchema();
