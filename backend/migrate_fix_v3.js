const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cropshield_db',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL');

        // Add is_verified column if it doesn't exist
        try {
            await connection.query('ALTER TABLE EmailVerifications ADD COLUMN is_verified BOOLEAN DEFAULT FALSE');
            console.log('✅ Added is_verified column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ Column is_verified already exists');
            } else {
                throw e;
            }
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
