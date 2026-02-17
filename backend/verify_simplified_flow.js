const http = require('http');

async function testSimplifiedFlow() {
    const registrationData = JSON.stringify({
        name: 'Simple User',
        username: 'simpleuser' + Date.now(),
        email: 'simple' + Date.now() + '@test.com',
        password: 'password123',
        role: 'Farmer',
        region: 'Wet Zone'
    });

    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': registrationData.length
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Registration Status:', res.statusCode);
            console.log('Registration Response:', data);

            if (res.statusCode === 201) {
                console.log('SUCCESS: User registered and verification link sent.');
            } else {
                console.log('FAILURE: Registration failed.');
            }
        });
    });

    req.on('error', (e) => console.error('Error:', e));
    req.write(registrationData);
    req.end();
}

testSimplifiedFlow();
