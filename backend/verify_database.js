// Database Setup Verification Script
// Run this to verify the database is properly set up

const pool = require('./src/config/db');

async function verifyDatabase() {
    try {
        console.log('🔍 Starting Database Verification...\n');

        // Check if database exists and is accessible
        console.log('1️⃣ Checking database connection...');
        const [dbCheck] = await pool.query('SELECT DATABASE() as db_name');
        console.log(`   ✅ Connected to database: ${dbCheck[0].db_name}\n`);

        // Check all required tables exist
        console.log('2️⃣ Checking required tables...');
        const requiredTables = [
            'users',
            'EmailVerifications',
            'PasswordResets',
            'diseases',
            'detections',
            'feedback'
        ];

        const [tables] = await pool.query('SHOW TABLES');
        const existingTables = tables.map(t => Object.values(t)[0]);

        let allTablesExist = true;
        for (const table of requiredTables) {
            const exists = existingTables.includes(table);
            const status = exists ? '✅' : '❌';
            console.log(`   ${status} ${table}`);
            if (!exists) allTablesExist = false;
        }

        if (!allTablesExist) {
            console.log('\n❌ Some required tables are missing!');
            console.log('   Please run: database/complete_database_setup.sql\n');
            process.exit(1);
        }
        console.log('');

        // Check data counts
        console.log('3️⃣ Checking data counts...');
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [diseaseCount] = await pool.query('SELECT COUNT(*) as count FROM diseases');
        const [detectionCount] = await pool.query('SELECT COUNT(*) as count FROM detections');
        const [feedbackCount] = await pool.query('SELECT COUNT(*) as count FROM feedback');

        console.log(`   Users: ${userCount[0].count}`);
        console.log(`   Diseases: ${diseaseCount[0].count}`);
        console.log(`   Detections: ${detectionCount[0].count}`);
        console.log(`   Feedback: ${feedbackCount[0].count}\n`);

        // Check test users
        console.log('4️⃣ Checking test users...');
        const [users] = await pool.query(
            'SELECT id, name, email, role, region, email_verified, is_approved FROM users ORDER BY id LIMIT 5'
        );

        users.forEach(user => {
            console.log(`   ✅ ${user.email} (${user.role}) - Verified: ${user.email_verified ? 'Yes' : 'No'}`);
        });
        console.log('');

        // Check user table schema
        console.log('5️⃣ Verifying users table schema...');
        const [columns] = await pool.query('DESCRIBE users');
        const requiredColumns = ['id', 'name', 'username', 'email', 'password', 'phone', 'role', 'region', 'is_approved', 'email_verified'];

        const existingColumns = columns.map(c => c.Field);
        let allColumnsExist = true;
        for (const col of requiredColumns) {
            const exists = existingColumns.includes(col);
            const status = exists ? '✅' : '❌';
            if (!exists) {
                console.log(`   ${status} ${col} - MISSING!`);
                allColumnsExist = false;
            }
        }

        if (allColumnsExist) {
            console.log('   ✅ All required columns present\n');
        } else {
            console.log('\n❌ Some required columns are missing!');
            console.log('   Please run: database/complete_database_setup.sql\n');
            process.exit(1);
        }

        // Final status
        console.log('═══════════════════════════════════════');
        console.log('✅ DATABASE VERIFICATION SUCCESSFUL!');
        console.log('═══════════════════════════════════════');
        console.log('\n📋 Test Credentials (all use password: password123):');
        console.log('   Farmer: farmer@test.com');
        console.log('   Expert: expert@test.com');
        console.log('   Admin: admin@test.com\n');
        console.log('🚀 You can now start the backend server: npm start\n');

    } catch (error) {
        console.error('\n❌ Database Verification Failed:');
        console.error('Error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure XAMPP MySQL is running');
        console.error('   2. Check .env file has correct credentials');
        console.error('   3. Run database/complete_database_setup.sql in phpMyAdmin');
        console.error('   4. Verify database name matches .env (should be: cropshield_db)\n');
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

verifyDatabase();
