const http = require('http');

const data = JSON.stringify({
    name: 'Debug User',
    email: `debug_${Date.now()}@test.com`,
    password: 'password123',
    role: 'Farmer',
    region: 'Wet'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending Test Request...');
const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
