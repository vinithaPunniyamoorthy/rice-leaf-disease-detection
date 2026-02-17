const pool = require('./src/config/db');

async function migrate() {
    try {
        console.log('--- Starting Migration ---');

        // 1. Add batch_id to detections
        console.log('Adding batch_id to detections table...');
        await pool.execute('ALTER TABLE detections ADD COLUMN IF NOT EXISTS batch_id VARCHAR(36) AFTER user_id');

        // 2. Create Image table
        console.log('Creating Image table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS Image (
                ImageID VARCHAR(36) PRIMARY KEY,
                UserID INT,
                ImagePath VARCHAR(255),
                UploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. Create batch_summaries table
        console.log('Creating batch_summaries table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS batch_summaries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                batch_id VARCHAR(36) UNIQUE,
                avg_healthy FLOAT,
                avg_rice_blast FLOAT,
                avg_brown_spot FLOAT,
                avg_unknown FLOAT,
                final_assessment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // 3. Update Analysis table columns
        console.log('Updating Analysis table...');
        // Note: Using a workaround for IF NOT EXISTS column in MySQL if needed, 
        // but pool.execute will fail if they exist, which we can handle.
        try {
            await pool.execute('ALTER TABLE Analysis ADD COLUMN healthy_prob FLOAT DEFAULT 0');
        } catch (e) {
            console.log('healthy_prob might already exist');
        }
        try {
            await pool.execute('ALTER TABLE Analysis ADD COLUMN unknown_prob FLOAT DEFAULT 0');
        } catch (e) {
            console.log('unknown_prob might already exist');
        }

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('--- Migration Failed ---');
        console.error(err);
        process.exit(1);
    }
}

migrate();
