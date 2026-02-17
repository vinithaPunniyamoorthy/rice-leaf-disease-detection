const os = require('os');
const fs = require('fs');
const interfaces = os.networkInterfaces();
let ip = '127.0.0.1';
for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
            ip = alias.address;
            break;
        }
    }
}
fs.writeFileSync('detected_ip.json', JSON.stringify({ ip: ip }));
console.log('Detected IP:', ip);
