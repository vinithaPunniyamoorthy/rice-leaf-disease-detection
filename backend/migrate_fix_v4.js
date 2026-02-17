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

        // We need to find the specific constraint name to drop it, or use a workaround.
        // Usually it's `emailverifications_ibfk_1` but let's check or just try dropping the foreign key by column name if supported (not standard).
        // Standard MySQL: ALTER TABLE tablename DROP FOREIGN KEY constraint_name;
        // Let's query information_schema to find the constraint name.

        const [rows] = await connection.execute(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'EmailVerifications' 
            AND COLUMN_NAME = 'email' 
            AND REFERENCED_TABLE_NAME = 'User'
            AND TABLE_SCHEMA = '${process.env.DB_NAME || 'cropshield_db'}'
        `);

        if (rows.length > 0) {
            const constraintName = rows[0].CONSTRAINT_NAME;
            console.log(`Found FK Constraint: ${constraintName}`);
            await connection.query(`ALTER TABLE EmailVerifications DROP FOREIGN KEY ${constraintName}`);
            console.log('✅ Dropped Foreign Key constraint');

            // Also drop the index causing "Cannot add or update child row" if it exists separately? 
            // Usually valid. Key is usually "email".
            // We want email to be UNIQUE, but not FK.
            // schema_v3.sql said "email VARCHAR(255) NOT NULL UNIQUE".
            // So the unique index is fine.
        } else {
            console.log('ℹ️ No Foreign Key constraint found on email column.');
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
