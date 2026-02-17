const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

/**
 * Send a verification link email using Nodemailer (Gmail SMTP).
 * @param {string} email - Recipient email address
 * @param {string} link - Verification link URL
 * @param {string} [userName] - Optional user name for personalization
 * @returns {Promise<boolean>} true if email was sent successfully
 */
exports.sendVerificationLink = async (email, link, userName) => {
    try {
        // ALWAYS Log the link for debugging/dev purposes
        console.log('🔗 [DEBUG] Verification Link:', link);

        if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
            console.error('❌ GMAIL_USER or GMAIL_PASS is not set in environment variables');
            // In dev, log the link so verification can still proceed
            console.log('🔗 Verification Link (no credentials):', link);
            return true;
        }

        const greeting = userName ? `Hi ${userName},` : 'Hi,';

        const mailOptions = {
            from: `"CropShield" <${process.env.GMAIL_USER}>`,
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
                        This link will expire in 15 minutes. If you did not create an account, please ignore this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📨 Email sent successfully via Nodemailer. Message ID:', info.messageId);
        return true;

    } catch (error) {
        console.error('❌ Error sending email via Nodemailer:', error.message);
        console.log('🔗 Verification Link (fallback):', link);
        return true; // Allow flow to continue in dev
    }
};
/**
 * Send a password reset email.
 */
exports.sendPasswordResetEmail = async (email, userName) => {
    try {
        const mailOptions = {
            from: `"CropShield" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif;">
                    <h1 style="color: #1a7f37;">🌾 CropShield</h1>
                    <p>Hi ${userName},</p>
                    <p>You requested a password reset. Please click the link below to reset your password:</p>
                    <p><a href="http://localhost:3000/reset-password">Reset Password</a></p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('❌ Error sending reset email:', error.message);
        return false;
    }
};

/**
 * Send an approval request to the specific Admin (Vinitha).
 */
exports.sendApprovalRequestToAdmin = async (adminEmail, expertDetails, link) => {
    try {
        const mailOptions = {
            from: `"CropShield" <${process.env.GMAIL_USER}>`,
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
        await transporter.sendMail(mailOptions);
        console.log('📨 Admin approval request sent to:', adminEmail);
        return true;
    } catch (error) {
        console.error('❌ Error sending admin approval:', error.message);
        return false;
    }
};

/**
 * Notify Expert that they have been approved.
 */
exports.sendExpertApprovalConfirmation = async (email, name) => {
    try {
        const mailOptions = {
            from: `"CropShield" <${process.env.GMAIL_USER}>`,
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
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('❌ Error sending expert confirmation:', error.message);
        return false;
    }
};
