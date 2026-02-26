require('dotenv').config();
const emailService = require('./src/services/emailService');

(async () => {
    console.log('Starting email test...');
    const ok = await emailService.sendVerificationLink('test@example.com', 'https://example.com/verify?token=abc', 'Test');
    console.log('Result =', ok);
})();
