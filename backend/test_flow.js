const http = require('http');

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
            res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
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

async function testFlow() {
    const email = `test_${Date.now()}@example.com`;
    console.log(`Testing with email: ${email}`);

    // 1. Register (Should trigger verification)
    console.log('\n--- Step 1: Register ---');
    try {
        const regRes = await postRequest('/api/auth/register', {
            name: 'Test User',
            email: email,
            password: 'password123',
            role: 'Farmer',
            region: 'Wet'
        });
        console.log('Status:', regRes.statusCode);
        console.log('Body:', regRes.body);

        if (regRes.statusCode !== 200 || regRes.body.status !== 'VERIFICATION_LINK_SENT') {
            console.error('❌ Failed Step 1: Expected VERIFICATION_LINK_SENT');
            return;
        }
        console.log('✅ Step 1 Passed');
    } catch (e) {
        console.error('❌ Error in Step 1:', e);
        return;
    }

    // 2. We need the token. Since we can't easily parse logs here (unless we read stdout of the other process),
    // we might need to "cheat" and get it from DB or expect the user to check logs?
    // Wait, I can connect to DB here since I have credentials.
    console.log('\n--- Step 2: Get Token from DB ---');
    const mysql = require('mysql2/promise');
    require('dotenv').config(); // Use local .env

    let token;
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'cropshield_db'
        });

        const [rows] = await connection.execute('SELECT token FROM EmailVerifications WHERE email = ?', [email]);
        if (rows.length > 0) {
            token = rows[0].token;
            console.log('Token found:', token);
        } else {
            console.error('❌ Token not found in DB');
            await connection.end();
            return;
        }
        await connection.end();
        console.log('✅ Step 2 Passed');
    } catch (e) {
        console.error('❌ Error in Step 2:', e);
        return;
    }

    // 3. Verify Email
    console.log('\n--- Step 3: Verify Email ---');
    try {
        const verifyRes = await getRequest(`/api/auth/verify-email?token=${token}`);
        console.log('Status:', verifyRes.statusCode);
        // Body is HTML
        if (verifyRes.statusCode === 200) {
            console.log('✅ Step 3 Passed (Email Verified)');
        } else {
            console.error('❌ Failed Step 3');
            return;
        }
    } catch (e) {
        console.error('❌ Error in Step 3:', e);
        return;
    }

    // 4. Register Again (Should create user)
    console.log('\n--- Step 4: Complete Registration ---');
    try {
        const completeRes = await postRequest('/api/auth/register', {
            name: 'Test User',
            email: email,
            password: 'password123',
            role: 'Farmer',
            region: 'Wet'

        });
        console.log('Status:', completeRes.statusCode);
        console.log('Body:', completeRes.body);

        if (completeRes.statusCode === 201 && completeRes.body.success) {
            console.log('✅ Step 4 Passed (User Created)');
        } else {
            console.error('❌ Failed Step 4');
            return;
        }
    } catch (e) {
        console.error('❌ Error in Step 4:', e);
        return;
    }

    // 5. Login
    console.log('\n--- Step 5: Login ---');
    try {
        const loginRes = await postRequest('/api/auth/login', {
            email: email,
            password: 'password123'
        });
        console.log('Status:', loginRes.statusCode);
        console.log('Body:', loginRes.body);

        if (loginRes.statusCode === 200 && loginRes.body.success) {
            console.log('✅ Step 5 Passed (Login Successful)');
        } else {
            console.error('❌ Failed Step 5');
            return;
        }
    } catch (e) {
        console.error('❌ Error in Step 5:', e);
        return;
    }

    console.log('\n🎉 ALL TESTS PASSED 🎉');
}

testFlow();
