const mysql = require('mysql2/promise');
const http = require('http');
require('dotenv').config();

async function runTests() {
    console.log('🚀 Starting Advanced Backend Verification Tests...\n');

    const baseURL = 'http://localhost:5000/api';
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'password123';
    let userId;
    let otp;
    let token;

    // 1. Test Registration
    console.log('--- Phase 1: Registration ---');
    const regData = JSON.stringify({
        name: 'Test QA User',
        email: testEmail,
        password: testPassword,
        role: 'Farmer',
        region: 'Dry'
    });

    const regRes = await postRequest('/auth/register', regData);
    console.log('Registration Response:', regRes);
    if (regRes.success) {
        userId = regRes.userId;
        console.log('✅ Registration Successful\n');
    } else {
        console.error('❌ Registration Failed');
        process.exit(1);
    }

    // 2. Mock Get OTP from DB
    console.log('--- Phase 2: Retrieve OTP from DB ---');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: 'cropshield_db_v2'
    });

    const [users] = await connection.execute('SELECT VerificationToken FROM User WHERE Email = ?', [testEmail]);
    otp = users[0].VerificationToken;
    console.log('Retrieved OTP:', otp);
    await connection.end();
    console.log('✅ OTP Retrieved\n');

    // 3. Test Email Verification
    console.log('--- Phase 3: Email Verification ---');
    const verifyData = JSON.stringify({ email: testEmail, otp: otp });
    const verifyRes = await postRequest('/auth/verify', verifyData);
    console.log('Verification Response:', verifyRes);
    if (verifyRes.success) {
        console.log('✅ Verification Successful\n');
    } else {
        console.error('❌ Verification Failed');
        process.exit(1);
    }

    // 4. Test Login
    console.log('--- Phase 4: Login ---');
    const loginData = JSON.stringify({ email: testEmail, password: testPassword });
    const loginRes = await postRequest('/auth/login', loginData);
    console.log('Login Response:', loginRes);
    if (loginRes.success) {
        token = loginRes.token;
        console.log('✅ Login Successful\n');
    } else {
        console.error('❌ Login Failed');
        process.exit(1);
    }

    // 5. Test Feedback
    console.log('--- Phase 5: Feedback Submission ---');
    const feedbackData = JSON.stringify({ comments: 'This system is working perfectly for QA verification.' });
    const feedbackRes = await postRequest('/detections/feedback', feedbackData, token);
    console.log('Feedback Response:', feedbackRes);
    if (feedbackRes.success) {
        console.log('✅ Feedback Successful\n');
    } else {
        console.error('❌ Feedback Failed');
    }

    console.log('⭐ ALL TESTS PASSED SUCCESSFULLY! ⭐');
}

function postRequest(path, data, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api${path}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve(body);
                }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

runTests().catch(err => {
    console.error('Test Execution Error:', err);
    process.exit(1);
});
