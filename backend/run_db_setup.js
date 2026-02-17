const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Allow executing multiple SQL statements
};

async function setupDatabase() {
    let connection;
    try {
        console.log('Connecting to MySQL server...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const sqlPath = path.join(__dirname, 'setup_database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing setup_database.sql...');
        await connection.query(sql);
        console.log('✅ Database setup completed successfully!');

        // Verification step
        console.log('Verifying tables...');
        await connection.query('USE cropshield_db');
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables in cropshield_db:', tables.map(t => Object.values(t)[0]));

    } catch (err) {
        console.error('❌ Database setup failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
