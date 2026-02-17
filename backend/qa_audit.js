const http = require('http');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/auth';
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cropshield_db_v2'
};

// Colors for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const log = (msg) => console.log(msg);
const section = (title) => console.log(`\n${BOLD}--- ${title} ---${RESET}`);
const pass = (msg) => console.log(`${GREEN}✅ PASS: ${msg}${RESET}`);
const fail = (msg) => console.log(`${RED}❌ FAIL: ${msg}${RESET}`);
const info = (msg) => console.log(`${YELLOW}ℹ️  INFO: ${msg}${RESET}`);

let hasErrors = false;
let bugsFound = [];

const reportBug = (title, module, steps, expected, actual, rootCause) => {
    bugsFound.push({ title, module, steps, expected, actual, rootCause });
    console.log(`\n${RED}🐞 BUG REPORTED: ${title}${RESET}`);
    console.log(`${RED}AFFECTED MODULE: ${module}${RESET}`);
    console.log(`${RED}STEPS TO REPRODUCE: ${steps}${RESET}`);
    console.log(`${RED}EXPECTED RESULT: ${expected}${RESET}`);
    console.log(`${RED}ACTUAL RESULT: ${actual}${RESET}`);
    console.log(`${RED}ROOT CAUSE: ${rootCause}${RESET}`);
    hasErrors = true;
};

const request = (method, path, data = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (err) => resolve({ error: err }));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
};

const runAudit = async () => {
    console.log(`${BOLD}🎯 STARTING FULL STACK QA AUDIT${RESET}\n`);

    // 1️⃣ ENVIRONMENT CHECK
    section('1. ENVIRONMENT CHECK');

    // Check Server Reachability
    const healthCheck = await request('GET', '/');
    if (healthCheck.error) {
        reportBug('Backend Server Unreachable', 'Environment', 'GET /', 'Status 200', `Error: ${healthCheck.error.code}`, 'Server likely not running');
        return; // specific abort
    } else {
        pass('Backend server is running');
    }

    // Check DB Connection
    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        pass('Database connection successful');
    } catch (err) {
        reportBug('Database Connection Failed', 'Database', 'Connect to MySQL', 'Success', `Error: ${err.message}`, 'Invalid credentials or DB down');
        return;
    }

    // Check Env Vars
    if (process.env.RESEND_API_KEY) pass('Resend API Key exists');
    else reportBug('Missing Resend API Key', 'Environment', 'Check .env', 'Key exists', 'Key missing', '.env misconfiguration');

    if (process.env.FRONTEND_VERIFY_URL) pass('Frontend Verify URL exists');
    else fail('Missing Frontend Verify URL in .env');

    // 2️⃣ DATABASE TESTING & 3️⃣ USER REGISTRATION TEST
    section('2. DATABASE & 3. REGISTRATION TEST');
    const testEmail = `qa_audit_${Date.now()}@test.com`;
    const testUser = { name: 'QA User', email: testEmail, password: 'password123', role: 'Farmer', region: 'Wet' };

    const regRes = await request('POST', '/api/auth/register', testUser);

    if (regRes.statusCode === 200 && regRes.body.status === 'VERIFICATION_LINK_SENT') {
        pass('User registration successful (API)');

        // Verify DB
        const [users] = await connection.execute('SELECT * FROM User WHERE Email = ?', [testEmail]);
        if (users.length === 1) {
            pass('User inserted into DB');
            if (users[0].IsVerified === 0) pass('User created as unverified (email_verified = false)');
            else reportBug('User Created as Verified', 'Database', 'Register user', 'IsVerified=0', 'IsVerified=1', 'Default value incorrect');
        } else {
            reportBug('User Not Found in DB', 'Database', 'Register user', 'Row in User table', 'No row found', 'Insert query failed');
        }

        // Verify Token
        const [tokens] = await connection.execute('SELECT * FROM EmailVerifications WHERE email = ?', [testEmail]);
        if (tokens.length === 1) {
            pass('Verification token stored in DB');
            // We can't easily check email delivery in this script without checking external logs or inboxes, 
            // but the API success implies the email service didn't throw.
        } else {
            reportBug('Token Not Stored', 'Database', 'Register user', 'Row in EmailVerifications', 'No row found', 'Insert query failed');
        }

    } else {
        reportBug('Registration API Failed', 'Assessment', 'POST /register', '200 OK', `${regRes.statusCode} - ${JSON.stringify(regRes.body)}`, 'API Logic Error');
    }

    // 4️⃣ EMAIL LINK VERIFICATION TEST
    section('4. EMAIL LINK VERIFICATION TEST');

    // We need the raw token. In a real scenario, we'd check the email. 
    // Here, we can't reverse the hash. 
    // Strategy: We will simulate the "Link Click" by *manually* inserting a known token hash for this user.
    // This validates the *verification logic*, even if we bypass the "email delivery check".

    const knownRawToken = crypto.randomBytes(32).toString('hex');
    const knownHashedToken = crypto.createHash('sha256').update(knownRawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await connection.execute('UPDATE EmailVerifications SET token = ?, expires_at = ?, is_verified = 0 WHERE email = ?', [knownHashedToken, expiresAt, testEmail]);
    info('Injected known token for verification test');

    const verifyRes = await request('GET', `/api/auth/verify-email?token=${knownRawToken}`);

    if (verifyRes.statusCode === 200) {
        pass('Verification API returned 200 OK');

        // Check DB status
        const [verifiedUser] = await connection.execute('SELECT IsVerified FROM User WHERE Email = ?', [testEmail]);
        if (verifiedUser[0]?.IsVerified === 1) pass('User marked verified in DB');
        else reportBug('User Not Marked Verified', 'Database', 'Verify API', 'IsVerified=1', 'IsVerified=0', 'Update query failed');

        const [verifiedToken] = await connection.execute('SELECT token, is_verified FROM EmailVerifications WHERE email = ?', [testEmail]);
        if (verifiedToken[0]?.is_verified === 1) pass('EmailVerifications marked verified');
        if (verifiedToken[0]?.token === null || verifiedToken[0]?.token === '') pass('Token invalidated (set to NULL or empty)');
        else {
            console.log('DEBUG: Verified Token Row:', verifiedToken[0]);
            reportBug('Token Not Invalidated', 'Database', 'Verify API', 'token=NULL', `token=${verifiedToken[0]?.token}`, 'Update query failed');
        }

    } else {
        reportBug('Verification API Failed', 'Verification', `GET /verify-email?token=${knownRawToken}`, '200 OK', `${verifyRes.statusCode}`, 'API Logic Error');
    }

    // Negative Verify Test (Reuse token/Invalid token)
    const negVerifyRes = await request('GET', `/api/auth/verify-email?token=${knownRawToken}`); // Reusing same token (which should be null now)
    if (negVerifyRes.statusCode === 400) pass('Reusing invalidated token blocked');
    else reportBug('Reusing Token Allowed', 'Security', 'Verify same token twice', '400 Bad Request', `${negVerifyRes.statusCode}`, 'Logic missing check');

    const invalidVerifyRes = await request('GET', `/api/auth/verify-email?token=invalid_token_string`);
    if (invalidVerifyRes.statusCode === 400) pass('Invalid token blocked');
    else reportBug('Invalid Token Allowed', 'Security', 'Verify invalid token', '400 Bad Request', `${invalidVerifyRes.statusCode}`, 'Validation missing');


    // 5️⃣ RESEND VERIFICATION EMAIL TEST
    section('5. RESEND VERIFICATION EMAIL TEST');

    // Test 1: Resend for VERIFIED user (Should fail)
    const resendVerified = await request('POST', '/api/auth/resend-verification-email', { email: testEmail });
    if (resendVerified.statusCode === 400) pass('Resend blocked for verified user');
    else reportBug('Resend Allowed for Verified User', 'Logic', 'POST /resend-verification-email', '400 Bad Request', `${resendVerified.statusCode}`, 'Missing Verified check');

    // Test 2: Resend for UNVERIFIED user
    // Create new unverified user
    const resendEmail = `resend_qa_${Date.now()}@test.com`;
    await request('POST', '/api/auth/register', { ...testUser, email: resendEmail });

    // Immediate Resend (might hit cooldown based on initial register creation? No, strictly implementation dependent. 
    // Implementation says: creation time based cooldown. Register creates a token. 
    // If we verify immediately, we might be blocked if Register sets the timestamp. 
    // Actually, implementation checks `expires_at`. Register sets `expires_at`.
    // So usually a resend immediately after register is NOT blocked by logic unless we check "created just now".
    // Wait, the implementation of resend says:
    // "Cooldown = 2 min after creation → allow resend only if now > (expires_at - 13 min)"
    // Register sets expires_at to +15min. So (expires_at - 13min) is (now + 2min).
    // So yes, immediately resending SHOULD be blocked by cooldown!

    const resendUnverified = await request('POST', '/api/auth/resend-verification-email', { email: resendEmail });
    if (resendUnverified.statusCode === 429) pass('Rate limiting (cooldown) enforced');
    else reportBug('Rate Limiting Failed', 'Security', 'Immediate Resend', '429 Too Many Requests', `${resendUnverified.statusCode}`, 'Cooldown logic incorrect');


    // 6️⃣ LOGIN TEST
    section('6. LOGIN TEST');

    // Login with VERIFIED user (testEmail)
    const loginSuccess = await request('POST', '/api/auth/login', { email: testEmail, password: 'password123' });
    if (loginSuccess.statusCode === 200 && loginSuccess.body.success) pass('Login successful for verified user');
    else reportBug('Login Failed for Verified User', 'Login', 'POST /login', '200 OK', `${loginSuccess.statusCode}`, 'Login logic error');

    // Login with UNVERIFIED user (resendEmail)
    const loginFail = await request('POST', '/api/auth/login', { email: resendEmail, password: 'password123' });
    if (loginFail.statusCode === 401) pass('Login blocked for unverified user');
    else reportBug('Login Allowed for Unverified User', 'Security', 'POST /login (unverified)', '401 Unauthorized', `${loginFail.statusCode}`, 'Missing IsVerified check');

    // Wrong Password
    const loginWrong = await request('POST', '/api/auth/login', { email: testEmail, password: 'wrongpassword' });
    if (loginWrong.statusCode === 400) pass('Wrong password blocked');
    else reportBug('Wrong Password Allowed', 'Security', 'POST /login (wrong pass)', '400 Bad Request', `${loginWrong.statusCode}`, 'Auth check failure');

    // Non-existing Email
    const loginNonExistent = await request('POST', '/api/auth/login', { email: 'doesnotexist@test.com', password: 'password123' });
    if (loginNonExistent.statusCode === 400) pass('Non-existing email handled');
    else reportBug('Non-existing Email Error', 'Login', 'POST /login (no user)', '400 Bad Request', `${loginNonExistent.statusCode}`, 'Error handling failure');


    // 7️⃣ ROLE-BASED ACCESS & 8️⃣ API RESPONSE VALIDATION
    section('7. ROLE & 8. API RESPONSE');

    if (loginSuccess.body.user && loginSuccess.body.user.role === 'Farmer') {
        pass('Role correctly returned in login response');
    } else {
        reportBug('Role Missing/Incorrect', 'Login', 'POST /login', 'Role: Farmer', `Role: ${loginSuccess.body.user?.role}`, 'Response mapping error');
    }

    if (loginSuccess.body.token) pass('JWT Token returned');
    else reportBug('JWT Token Missing', 'Login', 'POST /login', 'Token in body', 'No token', 'JWT generation failed');


    // 9️⃣ SECURITY TESTING
    section('9. SECURITY TESTING');

    // Check if token stored in DB is hashed (not equal to raw token)
    // We already inserted a hash for testEmail manually. 
    // Let's check resendEmail (created via Register). Token should be hashed.
    // We can't know the raw token for resendEmail (it's in the email/server log), 
    // but we can check if it looks like a hash (64 chars for sha256 hex).
    const [resendTokenRow] = await connection.execute('SELECT token FROM EmailVerifications WHERE email = ?', [resendEmail]);
    const storedToken = resendTokenRow[0]?.token;

    if (storedToken && storedToken.length === 64) pass('Token stored as SHA-256 hash (64 chars)');
    else reportBug('Token Not Hashed', 'Security', 'Check DB token', '64 char hash', `${storedToken?.length} chars`, 'Hashing missing');

    await connection.end();

    // 🏁 FINAL REPORT
    console.log(`\n${BOLD}========================================${RESET}`);
    console.log(`${BOLD}       ✅ FINAL AUDIT REPORT       ${RESET}`);
    console.log(`${BOLD}========================================${RESET}`);

    console.log(`\nMODULES TESTED: Environment, Database, Registration, Verification, Resend, Login, Role, API, Security`);

    if (bugsFound.length === 0) {
        console.log(`\n${GREEN}${BOLD}TEST SUMMARY: PASS${RESET}`);
        console.log(`\n${GREEN}${BOLD}✅ FULLY WORKING${RESET}`);
        console.log(`All systems operational. No bugs found.`);
    } else {
        console.log(`\n${RED}${BOLD}TEST SUMMARY: FAIL${RESET}`);
        console.log(`\n${RED}${BOLD}⚠️ PARTIALLY WORKING / ❌ NOT WORKING${RESET}`);
        console.log(`\n${BOLD}BUGS FOUND (${bugsFound.length}):${RESET}`);
        bugsFound.forEach((bug, i) => {
            console.log(`${i + 1}. ${bug.title} (${bug.module})`);
        });
    }
};

runAudit().catch(err => {
    console.error('CRITICAL AUDIT ERROR:', err);
});
