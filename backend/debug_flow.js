const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config();

const postRequest = (path, data) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body || '{}') }));
        });

        req.on('error', reject);
        req.write(JSON.stringify(data));
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

async function debugFlow() {
    const email = `debug_${Date.now()}@example.com`;
    console.log(`Testing with email: ${email}`);

    // 1. Register (Trigger Verification)
    await postRequest('/api/auth/register', {
        name: 'Debug User',
        email: email,
        password: 'password123',
        role: 'Farmer',
        region: 'Wet'
    });

    // 2. Get Token
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cropshield_db_v2'
    });

    const [rows] = await connection.execute('SELECT token FROM EmailVerifications WHERE email = ?', [email]);
    if (rows.length === 0) {
        console.error('❌ Token not found');
        return;
    }
    const token = rows[0].token;

    // 3. Verify
    await getRequest(`/api/auth/verify-email?token=${token}`);

    // 4. Register Again (Create User)
    await postRequest('/api/auth/register', {
        name: 'Debug User',
        email: email,
        password: 'password123',
        role: 'Farmer',
        region: 'Wet'
    });

    // 5. INSPECT USER RECORD
    const [users] = await connection.execute('SELECT * FROM User WHERE Email = ?', [email]);
    if (users.length > 0) {
        const user = users[0];
        console.log('\n--- CREATED USER RECORD ---');
        console.log(user);
        console.log('Keys:', Object.keys(user));
        console.log('IsVerified value:', user.IsVerified);
        console.log('IsVerified type:', typeof user.IsVerified);
        console.log('isVerified value:', user.isVerified); // Check lowercase
        console.log('---------------------------\n');
    } else {
        console.error('❌ User record not created!');
    }

    await connection.end();

    // 6. Attempt Login
    const loginRes = await postRequest('/api/auth/login', {
        email: email,
        password: 'password123'
    });
    console.log('Login Response:', loginRes.statusCode, loginRes.body);
}

debugFlow();
