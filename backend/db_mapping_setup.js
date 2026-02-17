const pool = require('./src/config/db');

async function setup() {
    try {
        console.log('--- Database Mapping Setup ---');

        // 1. Admin Table
        console.log('Checking Admin table...');
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS Admin (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                admin_name VARCHAR(100),
                email VARCHAR(150)
            )
        `);

        await pool.execute(`
            INSERT INTO Admin (admin_name, email) 
            SELECT * FROM (SELECT "Cropshield Admin", "admin@cropshield.com") AS tmp 
            WHERE NOT EXISTS (SELECT admin_name FROM Admin WHERE admin_name = "Cropshield Admin") 
            LIMIT 1
        `);
        console.log('✅ Admin table ready.');

        // 2. Images Table (check upload_type)
        console.log('Checking Image table...');
        const [cols] = await pool.execute('DESCRIBE image');
        if (!cols.some(c => c.Field.toLowerCase() === 'upload_type')) {
            await pool.execute('ALTER TABLE image ADD COLUMN upload_type VARCHAR(20) DEFAULT "upload"');
            console.log('✅ Added upload_type to image table.');
        } else {
            console.log('✅ image table already has upload_type.');
        }

        // 3. Analysis Table (check analysis_result)
        // User requested: analysis_id, image_id, analysis_result, created_at
        // Already exists in DB based on SHOW TABLES.
        console.log('Checking Analysis table...');
        const [analysisCols] = await pool.execute('DESCRIBE analysis');
        console.log('Analysis columns:', analysisCols.map(c => c.Field));

        // 4. Feedback Table
        // User requested: feedback_id, image_id, farmer_id, field_expert_id, feedback_text, created_at
        console.log('Checking Feedback table...');
        const [feedbackCols] = await pool.execute('DESCRIBE feedback');
        console.log('Feedback columns:', feedbackCols.map(c => c.Field));

        console.log('--- Setup Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Setup failed:', err);
        process.exit(1);
    }
}

setup();
