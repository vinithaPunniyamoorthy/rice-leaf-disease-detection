const pool = require('./src/config/db');

async function reconcile() {
    try {
        console.log('--- Starting Fully Idempotent Reconcile Schema ---');

        const safeQuery = async (query) => {
            try { await pool.execute(query); console.log(`SUCCESS: ${query}`); }
            catch (e) { console.log(`SKIPPED: ${query} (${e.message})`); }
        };

        const ensureTablePlural = async (singular, plural) => {
            const [tables] = await pool.execute('SHOW TABLES');
            const tableNames = tables.map(r => Object.values(r)[0].toLowerCase());
            if (!tableNames.includes(plural.toLowerCase())) {
                if (tableNames.includes(singular.toLowerCase())) {
                    await safeQuery(`RENAME TABLE ${singular} TO ${plural}`);
                } else {
                    // This might be a fresh start or different naming
                    console.log(`Table ${plural} missing and ${singular} also missing.`);
                }
            } else {
                console.log(`Table ${plural} already exists.`);
            }
        };

        const ensureCol = async (table, oldCol, newCol, definition) => {
            const [cols] = await pool.execute(`DESCRIBE ${table}`);
            const names = cols.map(c => c.Field);
            if (!names.includes(newCol)) {
                if (oldCol && names.includes(oldCol)) {
                    await safeQuery(`ALTER TABLE ${table} CHANGE ${oldCol} ${newCol} ${definition}`);
                } else {
                    await safeQuery(`ALTER TABLE ${table} ADD COLUMN ${newCol} ${definition}`);
                }
            } else {
                console.log(`Column ${table}.${newCol} already exists.`);
            }
        };

        // 1. Rename tables to plural lowercase
        await ensureTablePlural('user', 'users');
        await ensureTablePlural('User', 'users');
        await ensureTablePlural('detection', 'detections');
        await ensureTablePlural('Detection', 'detections');
        await ensureTablePlural('Analysis', 'analysis');
        await ensureTablePlural('Feedback', 'feedback');
        await ensureTablePlural('Disease', 'diseases');
        await ensureTablePlural('disease', 'diseases');
        await ensureTablePlural('image', 'images');
        await ensureTablePlural('Image', 'images');
        await ensureTablePlural('admin', 'admins');
        await ensureTablePlural('Admin', 'admins');

        // 2. Standardize users
        await ensureCol('users', 'UserID', 'id', 'VARCHAR(50)');
        await ensureCol('users', 'UserName', 'username', 'VARCHAR(100)');
        await ensureCol('users', 'UserRole', 'role', 'VARCHAR(50)');
        await ensureCol('users', 'IsVerified', 'is_verified', 'TINYINT(1) DEFAULT 0');
        await ensureCol('users', null, 'name', 'VARCHAR(255) AFTER id');
        await ensureCol('users', null, 'is_approved', 'BOOLEAN DEFAULT TRUE AFTER role');
        await ensureCol('users', 'Region', 'region', 'VARCHAR(100) AFTER role');
        await ensureCol('users', null, 'status', "ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE') DEFAULT 'ACTIVE' AFTER is_approved");
        await ensureCol('users', null, 'is_verified', 'TINYINT(1) DEFAULT 0 AFTER status');

        // 3. Standardize detections
        await ensureCol('detections', 'DetectionID', 'id', 'VARCHAR(50)');
        await ensureCol('detections', 'UserID', 'user_id', 'VARCHAR(50)');
        await ensureCol('detections', 'DetectionDate', 'detected_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        await ensureCol('detections', null, 'batch_id', 'VARCHAR(36) AFTER user_id');
        await ensureCol('detections', null, 'confidence', 'FLOAT DEFAULT 0');
        await ensureCol('detections', null, 'disease_id', 'INT');

        // 4. Standardize analysis
        await ensureCol('analysis', 'AnalysisID', 'id', 'VARCHAR(50)');
        await ensureCol('analysis', 'DetectionID', 'detection_id', 'VARCHAR(50)');
        await ensureCol('analysis', 'AnalysisDate', 'analysis_date', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        await ensureCol('analysis', null, 'rice_blast_prob', 'FLOAT DEFAULT 0');
        await ensureCol('analysis', null, 'brown_spot_prob', 'FLOAT DEFAULT 0');
        await ensureCol('analysis', null, 'healthy_prob', 'FLOAT DEFAULT 0');
        await ensureCol('analysis', null, 'unknown_prob', 'FLOAT DEFAULT 0');

        // 5. Standardize feedback
        await ensureCol('feedback', 'FeedbackID', 'id', 'VARCHAR(50)');
        await ensureCol('feedback', 'Comments', 'message', 'TEXT');
        await ensureCol('feedback', null, 'sender_username', 'VARCHAR(255) AFTER id');
        await ensureCol('feedback', null, 'receiver_username', 'VARCHAR(255) AFTER sender_username');

        // 6. email_verifications additions
        await ensureTablePlural('emailverifications', 'email_verifications');
        await ensureTablePlural('EmailVerifications', 'email_verifications');
        await ensureCol('email_verifications', null, 'name', 'VARCHAR(255)');
        await ensureCol('email_verifications', null, 'username', 'VARCHAR(255)');
        await ensureCol('email_verifications', null, 'password', 'VARCHAR(255)');
        await ensureCol('email_verifications', null, 'role', 'VARCHAR(50)');
        await ensureCol('email_verifications', null, 'region', 'VARCHAR(100)');
        await ensureCol('email_verifications', null, 'type', "ENUM('VERIFICATION', 'APPROVAL') DEFAULT 'VERIFICATION'");

        // 7. admins
        await ensureTablePlural('admin', 'admins');
        await ensureTablePlural('Admin', 'admins');
        await ensureCol('admins', 'admin_id', 'id', 'VARCHAR(50)');
        await ensureCol('admins', 'admin_name', 'name', 'VARCHAR(255)');

        // Ensure Vinitha is the admin
        await pool.execute("REPLACE INTO admins (id, name, email) VALUES (?, ?, ?)", ['A001', 'Vinitha', 'viniththap@gmail.com']);
        console.log("SUCCESS: Admin Vinitha ensured.");

        // 8. missing batch_summaries
        await safeQuery(`CREATE TABLE IF NOT EXISTS batch_summaries (
            batch_id VARCHAR(50) PRIMARY KEY,
            avg_healthy FLOAT,
            avg_rice_blast FLOAT,
            avg_brown_spot FLOAT,
            avg_unknown FLOAT,
            final_assessment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        console.log('--- Reconcile Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('--- CRITICAL RECONCILE FAILURE ---');
        console.error(err);
        process.exit(1);
    }
}

reconcile();
