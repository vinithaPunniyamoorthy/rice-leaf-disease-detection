const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        console.log('✅ MySQL Connection OK');

        // Check if database exists
        const [databases] = await connection.execute("SHOW DATABASES LIKE 'cropshield_db'");
        if (databases.length === 0) {
            console.log('❌ Database cropshield_db NOT FOUND');
            await connection.end();
            return;
        }

        console.log('✅ Database cropshield_db exists');

        // Use the database
        await connection.execute('USE cropshield_db');

        // Check users table structure
        const [columns] = await connection.execute("DESCRIBE users");
        console.log('\\n📋 Users table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        // Check if phone column exists
        const hasPhone = columns.some(col => col.Field === 'phone');
        console.log(`\\n${hasPhone ? '✅' : '❌'} Phone column ${hasPhone ? 'EXISTS' : 'MISSING'}`);

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDatabase();
