const https = require('https');

function test(path, label) {
    return new Promise((resolve) => {
        const url = 'https://rice-leaf-disease-detection-production.up.railway.app' + path;
        const req = https.get(url, { timeout: 15000 }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`\n=== ${label} ===`);
                console.log(`URL: ${url}`);
                console.log(`Status: ${res.statusCode}`);
                try {
                    console.log(JSON.stringify(JSON.parse(body), null, 2));
                } catch (e) {
                    console.log(body.substring(0, 500));
                }
                resolve();
            });
        });
        req.on('error', (e) => { console.log(`\n=== ${label} === ERROR: ${e.message}`); resolve(); });
        req.on('timeout', () => { req.destroy(); console.log(`\n=== ${label} === TIMEOUT`); resolve(); });
    });
}

(async () => {
    await test('/', 'ROOT');
    await test('/health', 'HEALTH');
    await test('/api/auth/login', 'LOGIN (GET - should 404 or 405)');
    process.exit(0);
})();
