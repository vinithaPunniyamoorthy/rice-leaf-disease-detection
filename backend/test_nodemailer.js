const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

(async function () {
    console.log('Attempting to send email via Nodemailer...');
    console.log(`User: ${process.env.GMAIL_USER}`);

    // Basic validation
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.GMAIL_PASS === 'your_app_password_here') {
        console.error('❌ Error: Please update .env with your real Gmail App Password.');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Test App" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Send to self for testing
            subject: "Test Email from Nodemailer",
            html: "<p>If you see this, Nodemailer is working!</p>",
        });
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
})();
