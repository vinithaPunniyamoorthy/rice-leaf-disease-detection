const http = require('http');

async function makeRequest(path, method, data, token = null) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload ? Buffer.byteLength(payload) : 0
            }
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body });
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing Farmer Flow ---');
    const farmerEmail = `farmer_${Date.now()}@test.com`;
    const farmerReg = await makeRequest('/api/auth/register', 'POST', {
        username: `farmer_${Date.now()}`,
        email: farmerEmail,
        password: 'password123',
        role: 'Farmer',
        name: 'Test Farmer'
    });
    console.log('Farmer Register Status:', farmerReg.statusCode, farmerReg.body.message);

    const farmerLoginFail = await makeRequest('/api/auth/login', 'POST', {
        email: farmerEmail,
        password: 'password123'
    });
    console.log('Farmer Login (Unverified) Status:', farmerLoginFail.statusCode, farmerLoginFail.body.message);

    console.log('\n--- Testing Field Expert Flow ---');
    const expertEmail = `expert_${Date.now()}@test.com`;
    const expertReg = await makeRequest('/api/auth/register', 'POST', {
        username: `expert_${Date.now()}`,
        email: expertEmail,
        password: 'password123',
        role: 'Field Expert',
        name: 'Test Expert'
    });
    console.log('Expert Register Status:', expertReg.statusCode, expertReg.body.message);

    const expertLoginFail = await makeRequest('/api/auth/login', 'POST', {
        email: expertEmail,
        password: 'password123'
    });
    console.log('Expert Login (Pending) Status:', expertLoginFail.statusCode, expertLoginFail.body.message);

    console.log('\nVerification complete. Manual check of admin approval and email link required for full end-to-end.');
}

runTests().catch(console.error);
