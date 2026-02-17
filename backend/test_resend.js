const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

(async function () {
    try {
        const data = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "delivered@resend.dev", // Using Resend's test address which always succeeds
            subject: "Test Email from Rice Disease App",
            html: "<p>This is a test email to verify the Resend integration.</p>",
        });
        console.log('✅ Email sent successfully:', data);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
})();
