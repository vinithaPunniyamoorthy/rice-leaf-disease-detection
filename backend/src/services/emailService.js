const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize Nodemailer Transporter with timeouts and configurable SMTP settings
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465');
const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : (smtpPort === 465);
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
const mailFromAddress = process.env.MAIL_FROM || smtpUser || 'noreply@cropshield.app';

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
        user: smtpUser,
        pass: smtpPass
    },
    connectionTimeout: 10000,  // 10s to establish connection
    greetingTimeout: 10000,    // 10s for SMTP greeting
    socketTimeout: 15000       // 15s for socket inactivity
});

// log transporter configuration (avoid exposing credentials)
console.log(`[EMAIL] SMTP transporter configured host=${smtpHost} port=${smtpPort} secure=${smtpSecure}`);

// verify SMTP connection at startup
transporter.verify()
    .then(() => console.log('[EMAIL] SMTP connection verified'))
    .catch(err => console.error('[EMAIL] SMTP verify failed:', err.message));

/**
 * Send mail with a hard timeout wrapper to prevent hanging.
 * Returns true on success, false on failure (never throws).
 */
async function sendMailWithTimeout(mailOptions, timeoutMs = 15000) {
    if (!smtpUser || !smtpPass) {
        const msg = '🔴 CRITICAL: SMTP_USER or SMTP_PASS (or GMAIL credentials) not set — emails CANNOT be sent. Configure these variables in Railway.';
        console.error(msg);
        console.error(`Current env: smtpUser=${smtpUser ? 'SET' : 'NOT_SET'}, smtpPass=${smtpPass ? 'SET' : 'NOT_SET'}`);
        console.error('Recipient email:', mailOptions?.to || 'UNKNOWN');
        return false;
    }
    console.log(`📧 [EMAIL] Sending to ${mailOptions.to} via ${smtpHost}:${smtpPort} secure=${smtpSecure}`);
    try {
        const result = await Promise.race([
            transporter.sendMail(mailOptions),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Email send timed out')), timeoutMs)
            )
        ]);
        console.log('📨 Email sent. Message ID:', result.messageId);
        return true;
    } catch (err) {
        console.error('❌ Email send failed:', err.stack || err.message);
        return false;
    }
}

/**
 * Send a verification link email using Nodemailer (Gmail SMTP).
 * @param {string} email - Recipient email address
 * @param {string} link - Verification link URL
 * @param {string} [userName] - Optional user name for personalization
 * @returns {Promise<boolean>} true if email was sent successfully
 */
exports.sendVerificationLink = async (email, link, userName) => {
    // ALWAYS log the link for debugging/dev purposes
    console.log('🔗 [DEBUG] Verification Link:', link);

    const greeting = userName ? `Hi ${userName},` : 'Hi,';
    const mailOptions = {
        from: `"CropShield" <${process.env.GMAIL_USER || 'noreply@cropshield.app'}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #1a7f37; margin: 0; font-size: 24px;">🌾 CropShield</h1>
                </div>
                <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 12px;">Verify Your Email Address</h2>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">${greeting}</p>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    Thank you for registering with CropShield. Please click the button below to verify your email address and activate your account.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${link}" style="background-color: #1a7f37; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                        Verify Email
                    </a>
                </div>
                <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link in your browser:</p>
                <p style="color: #2563eb; font-size: 13px; word-break: break-all;">${link}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    This link will expire in 24 hours. If you did not create an account, please ignore this email.
                </p>
            </div>
        `
    };

    return sendMailWithTimeout(mailOptions, 15000);
};
/**
 * Send a password reset email.
 */
exports.sendPasswordResetEmail = async (email, userName, link) => {
    const mailOptions = {
        from: `"CropShield" <${process.env.GMAIL_USER || 'noreply@cropshield.app'}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #1a7f37; margin: 0; font-size: 24px;">🌾 CropShield</h1>
                </div>
                <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 12px;">Reset Your Password</h2>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hi ${userName},</p>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                    You requested to reset your password. Please click the button below to set a new password.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${link}" style="background-color: #166534; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email.</p>
            </div>
        `
    };
    return sendMailWithTimeout(mailOptions, 15000);
};

/**
 * Send an approval request to the specific Admin (Vinitha).
 */
exports.sendApprovalRequestToAdmin = async (adminEmail, expertDetails, link) => {
    const mailOptions = {
        from: `"CropShield" <${process.env.GMAIL_USER || 'noreply@cropshield.app'}>`,
        to: adminEmail,
        subject: 'NEW Field Expert Approval Required',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                <h1 style="color: #1a7f37; font-size: 24px;">🌾 CropShield Admin</h1>
                <h2 style="color: #1f2937; font-size: 18px;">Approval Required for Field Expert</h2>
                <p style="color: #4b5563;">A new Field Expert has registered and requires your approval to access the system.</p>
                <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 4px 0;"><strong>Name:</strong> ${expertDetails.name}</p>
                    <p style="margin: 4px 0;"><strong>Email:</strong> ${expertDetails.email}</p>
                    <p style="margin: 4px 0;"><strong>Region:</strong> ${expertDetails.region || 'Not specified'}</p>
                </div>
                <div style="text-align: center;">
                    <a href="${link}" style="background-color: #1a7f37; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                        Approve Expert
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">This is a mandatory security notification.</p>
            </div>
        `
    };
    return sendMailWithTimeout(mailOptions, 15000);
};

/**
 * Notify Expert that they have been approved.
 */
exports.sendExpertApprovalConfirmation = async (email, name) => {
    const mailOptions = {
        from: `"CropShield" <${process.env.GMAIL_USER || 'noreply@cropshield.app'}>`,
        to: email,
        subject: 'Account Approved - Welcome to CropShield',
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
                <h1 style="color: #1a7f37; font-size: 24px;">🌾 CropShield</h1>
                <p>Hi ${name},</p>
                <p>Congratulations! Your account as a <strong>Field Expert</strong> has been approved by the admin.</p>
                <p>You can now log in to the application and start your work.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #9ca3af; font-size: 12px;">Thank you for joining our team.</p>
            </div>
        `
    };
    return sendMailWithTimeout(mailOptions, 15000);
};
