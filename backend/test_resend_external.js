const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

(async function () {
    const testEmail = "test.user@gmail.com"; // Arbitrary unverified email
    console.log(`Attempting to send to ${testEmail}...`);
    try {
        const data = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: testEmail,
            subject: "Test Email to External User",
            html: "<p>This is a test email to verify external delivery.</p>",
        });

        if (data.error) {
            console.error('❌ Resend returned error:', data.error);
        } else {
            console.log('✅ Email sent successfully (unexpected for onboarding domain):', data);
        }
    } catch (error) {
        console.error('❌ Exception sending email:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
})();
