const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
    try {
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_NAME:', process.env.DB_NAME);

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cropshield_db'
        });

        console.log('✅ Connected to MySQL');

        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables:', rows);

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkTables();
