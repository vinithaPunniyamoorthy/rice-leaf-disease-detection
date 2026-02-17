const pool = require('./src/config/db');
async function check() {
    try {
        const [cols] = await pool.execute('SHOW COLUMNS FROM email_verifications');
        console.log(JSON.stringify(cols, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
