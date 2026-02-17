const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding verification columns to users table...');

        // Add verification_token and token_expires_at if they don't exist
        await pool.execute(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP NULL;
        `);

        console.log('Database updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
