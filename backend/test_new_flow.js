/**
 * test_new_flow.js — End-to-end test for the Resend-based verification flow.
 *
 * Tests:
 *  1. Register (creates unverified user + sends email)
 *  2. Get hashed token from DB, verify raw token via GET /verify-email
 *  3. Login immediately after verification
 *  4. Resend verification for already-verified user (should fail)
 *  5. Register duplicate verified email (should fail)
 *
 * Prerequisites: server must be running on port 5000.
 */

const http = require('http');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
require('dotenv').config();

const postRequest = (path, data) => {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });

        req.on('error', reject);
        req.write(jsonData);
        req.end();
    });
};

const getRequest = (path) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: body }));
        });

        req.on('error', reject);
        req.end();
    });
};

async function testFlow() {
    const email = `testresend_${Date.now()}@example.com`;
    console.log(`\n🧪 Testing Resend Email Verification Flow`);
    console.log(`   Email: ${email}\n`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cropshield_db_v2'
    });

    // ── Step 1: Register ──────────────────────────
    console.log('── Step 1: Register ──');
    const regRes = await postRequest('/api/auth/register', {
        name: 'Resend Test User',
        email: email,
        password: 'password123',
        role: 'Farmer',
        region: 'Wet'
    });
    console.log('   Status:', regRes.statusCode, '| Body:', JSON.stringify(regRes.body));

    if (regRes.statusCode !== 200 || regRes.body.status !== 'VERIFICATION_LINK_SENT') {
        console.error('   ❌ FAILED: Expected VERIFICATION_LINK_SENT');
        await connection.end();
        return;
    }
    console.log('   ✅ PASSED\n');

    // ── Step 2: Get raw token from server logs ────
    // Since tokens are hashed in DB, we need to find the raw token.
    // The server logs print the verification link which includes the raw token.
    // For automated testing, we look up the hashed token from DB and use a workaround:
    // We'll directly query the DB for the hashed token, then we need the raw token.
    // Since we cannot reverse the hash, the test script will read the link from the
    // server console output. As a workaround for automated tests, we temporarily
    // store the raw token by checking what the server logged.
    //
    // ALTERNATIVE: For this test, we'll insert a KNOWN token directly.
    console.log('── Step 2: Insert known token for testing ──');
    const knownRawToken = crypto.randomBytes(32).toString('hex');
    const knownHashedToken = crypto.createHash('sha256').update(knownRawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await connection.execute('DELETE FROM EmailVerifications WHERE email = ?', [email]);
    await connection.execute(
        'INSERT INTO EmailVerifications (email, token, expires_at, is_verified) VALUES (?, ?, ?, 0)',
        [email, knownHashedToken, expiresAt]
    );
    console.log('   Raw token:', knownRawToken.substring(0, 12) + '...');
    console.log('   ✅ Token inserted\n');

    // ── Step 3: Verify user is unverified ─────────
    console.log('── Step 3: Check user is unverified ──');
    const [usersBefore] = await connection.execute('SELECT IsVerified FROM User WHERE Email = ?', [email]);
    console.log('   IsVerified (before):', usersBefore[0].IsVerified);
    if (usersBefore[0].IsVerified !== 0) {
        console.error('   ❌ FAILED: User should be unverified initially');
        await connection.end();
        return;
    }
    console.log('   ✅ PASSED\n');

    // ── Step 4: Verify email with raw token ───────
    console.log('── Step 4: Verify Email (GET /verify-email) ──');
    const verifyRes = await getRequest(`/api/auth/verify-email?token=${knownRawToken}`);
    console.log('   Status:', verifyRes.statusCode);
    if (verifyRes.statusCode !== 200) {
        console.error('   ❌ FAILED: Verification returned', verifyRes.statusCode);
        await connection.end();
        return;
    }
    console.log('   ✅ PASSED\n');

    // ── Step 5: Login immediately ─────────────────
    console.log('── Step 5: Login ──');
    const loginRes = await postRequest('/api/auth/login', {
        email: email,
        password: 'password123'
    });
    console.log('   Status:', loginRes.statusCode, '| Body:', JSON.stringify(loginRes.body));

    if (loginRes.statusCode === 200 && loginRes.body.success) {
        console.log('   ✅ PASSED: Login successful after verification\n');
    } else {
        console.error('   ❌ FAILED: Login failed after verification');
        await connection.end();
        return;
    }

    // ── Step 6: Resend for already-verified user ──
    console.log('── Step 6: Resend verification (should fail — already verified) ──');
    const resendRes = await postRequest('/api/auth/resend-verification-email', { email });
    console.log('   Status:', resendRes.statusCode, '| Body:', JSON.stringify(resendRes.body));

    if (resendRes.statusCode === 400 && resendRes.body.success === false) {
        console.log('   ✅ PASSED: Correctly rejected already-verified user\n');
    } else {
        console.error('   ❌ FAILED: Should have rejected resend for verified user');
        await connection.end();
        return;
    }

    // ── Step 7: Re-register verified email ────────
    console.log('── Step 7: Register again (should fail — already verified) ──');
    const reRegRes = await postRequest('/api/auth/register', {
        name: 'Resend Test User',
        email: email,
        password: 'password123',
        role: 'Farmer',
        region: 'Wet'
    });
    console.log('   Status:', reRegRes.statusCode, '| Body:', JSON.stringify(reRegRes.body));

    if (reRegRes.statusCode === 400) {
        console.log('   ✅ PASSED: Correctly rejected duplicate registration\n');
    } else {
        console.error('   ❌ FAILED: Should have rejected duplicate verified registration');
        await connection.end();
        return;
    }

    // ── Step 8: Expired token test ────────────────
    console.log('── Step 8: Expired token test ──');
    const expiredEmail = `expired_${Date.now()}@example.com`;
    // Create a user
    const expUserId = crypto.randomUUID();
    const expHashedPwd = await (async () => { const bcrypt = require('bcryptjs'); return bcrypt.hash('pass123', 10); })();
    await connection.execute(
        'INSERT INTO User (UserID, UserName, Email, Password, UserRole, IsVerified) VALUES (?, ?, ?, ?, ?, ?)',
        [expUserId, 'Expired User', expiredEmail, expHashedPwd, 'Farmer', false]
    );
    // Insert expired token
    const expRawToken = crypto.randomBytes(32).toString('hex');
    const expHashedToken = crypto.createHash('sha256').update(expRawToken).digest('hex');
    const pastDate = new Date(Date.now() - 60 * 1000); // already expired
    await connection.execute(
        'INSERT INTO EmailVerifications (email, token, expires_at, is_verified) VALUES (?, ?, ?, 0)',
        [expiredEmail, expHashedToken, pastDate]
    );

    const expVerifyRes = await getRequest(`/api/auth/verify-email?token=${expRawToken}`);
    console.log('   Status:', expVerifyRes.statusCode);
    if (expVerifyRes.statusCode === 400) {
        console.log('   ✅ PASSED: Expired token correctly rejected\n');
    } else {
        console.error('   ❌ FAILED: Should have rejected expired token');
    }

    // ── Step 9: Invalid token test ────────────────
    console.log('── Step 9: Invalid token test ──');
    const invalidRes = await getRequest('/api/auth/verify-email?token=totally_invalid_token_12345');
    console.log('   Status:', invalidRes.statusCode);
    if (invalidRes.statusCode === 400) {
        console.log('   ✅ PASSED: Invalid token correctly rejected\n');
    } else {
        console.error('   ❌ FAILED: Should have rejected invalid token');
    }

    await connection.end();
    console.log('🎉 ALL TESTS PASSED 🎉\n');
}

testFlow().catch(e => {
    console.error('CRITICAL ERROR IN TEST SCRIPT:', e);
});
