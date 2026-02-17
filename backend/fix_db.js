const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'cropshield_db'
        });

        console.log('✅ Connected to cropshield_db');

        // Try to get table info using SHOW COLUMNS
        try {
            const [columns] = await connection.query('SHOW COLUMNS FROM users');
            console.log('\\n📋 Current users table columns:');
            const columnNames = columns.map(col => col.Field);
            columns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`);
            });

            // Check if phone exists
            if (!columnNames.includes('phone')) {
                console.log('\\n❌ Phone column is MISSING. Adding it now...');
                await connection.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER password');
                console.log('✅ Phone column added successfully!');
            } else {
                console.log('\\n✅ Phone column already exists!');
            }

            // Verify again
            const [updatedColumns] = await connection.query('SHOW COLUMNS FROM users');
            console.log('\\n📋 Updated users table columns:');
            updatedColumns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`);
            });

        } catch (err) {
            console.error('Error checking/fixing table:', err.message);
        }

        await connection.end();
        console.log('\\n✅ Database check complete');
    } catch (error) {
        console.error('❌ Database Error:', error.message);
    }
}

fixDatabase();
