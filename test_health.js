const https = require('https');
const url = 'https://rice-leaf-disease-detection-production.up.railway.app/health';
console.log('Testing: ' + url);
const req = https.get(url, { timeout: 15000 }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('HTTP ' + res.statusCode);
        try {
            const j = JSON.parse(body);
            console.log(JSON.stringify(j, null, 2));
        } catch (e) {
            console.log(body);
        }
        process.exit(0);
    });
});
req.on('error', (e) => { console.log('ERROR: ' + e.message); process.exit(1); });
req.on('timeout', () => { req.destroy(); console.log('TIMEOUT'); process.exit(1); });
