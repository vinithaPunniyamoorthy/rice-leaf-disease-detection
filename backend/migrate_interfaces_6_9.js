const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('--- Starting Migration for Interfaces 6-9 ---');

        // 1. Update feedback table
        // We need to support sender/recipient usernames and feedback message.
        // Also handling possible existing columns from complete_setup.sql
        console.log('Updating feedback table...');

        // Add message column if it doesn't exist
        try {
            await pool.execute('ALTER TABLE feedback ADD COLUMN message TEXT AFTER user_id');
        } catch (e) {
            console.log('message column might already exist');
        }

        // Add sender_username and receiver_username for strict filtering by username as requested
        try {
            await pool.execute('ALTER TABLE feedback ADD COLUMN sender_username VARCHAR(255) AFTER id');
        } catch (e) {
            console.log('sender_username column might already exist');
        }

        try {
            await pool.execute('ALTER TABLE feedback ADD COLUMN receiver_username VARCHAR(255) AFTER sender_username');
        } catch (e) {
            console.log('receiver_username column might already exist');
        }

        // 2. Ensure detections has disease name and probability if not already handled by Analysis table
        // Based on previous tasks, we have Analysis table for probabilities.
        // We need to make sure we can efficiently query detections by region (via join with users)

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('--- Migration Failed ---');
        console.error(err);
        process.exit(1);
    }
}

migrate();
