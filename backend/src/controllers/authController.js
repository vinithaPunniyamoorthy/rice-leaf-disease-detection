const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const fs = require('fs');

function logToFile(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('server_crash.log', `[AUTH] [${timestamp}] ${msg}\n`);
}

// ─── Helpers ──────────────────────────────────────────────

/** Generate a cryptographically random verification token (raw hex). */
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/** SHA-256 hash a token before storing it in the database. */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/** Build the verification link from the env variable. */
const buildLink = (rawToken, path = '/api/auth/verify-email') => {
    const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5000';
    return `${baseUrl.replace(/\/$/, '')}${path}?token=${rawToken}`;
};

// ─── POST /register ───────────────────────────────────────

exports.register = async (req, res) => {
    logToFile('Register request received (Simplified Flow)');
    console.log('Registration request received:', req.body);
    let { name, email, password, role, region, username } = req.body;

    if (!name && username) name = username;

    try {
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required', success: false });
        }

        // 1. Check if user already exists
        const [existingUser] = await pool.execute('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUser.length > 0) {
            return res.status(400).json({
                message: existingUser[0].email === email ? 'Email already exists.' : 'Username already exists.',
                success: false
            });
        }

        logToFile('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const rawToken = generateVerificationToken();
        const hashedToken = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const userId = uuidv4();

        // 2. Insert into users table
        logToFile(`Inserting user ${email} into users table...`);
        const initialStatus = role === 'Field Expert' ? 'PENDING_APPROVAL' : 'UNVERIFIED';

        await pool.execute(
            'INSERT INTO users (id, name, username, email, password, role, region, is_verified, status, verification_token, token_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, name, username, email, hashedPassword, role, region || null, 0, initialStatus, hashedToken, expiresAt]
        );

        const link = buildLink(rawToken);

        if (role === 'Field Expert') {
            logToFile('Notifying Admin about new Field Expert...');
            // Build approval link that identifies the FIELD EXPERT (not the admin)
            const approvalLink = buildLink(rawToken, '/api/auth/approve-expert-email');
            let adminEmail = 'viniththap@gmail.com';
            try {
                const [admins] = await pool.execute('SELECT email FROM admins WHERE id = "A001" LIMIT 1');
                if (admins.length > 0) adminEmail = admins[0].email;
            } catch (err) { console.error('Error fetching admin email:', err); }

            await emailService.sendApprovalRequestToAdmin(adminEmail, { name, email, region }, approvalLink);

            return res.status(201).json({
                message: 'Registration submitted! Your account is pending admin approval. You will be notified via email once approved.',
                success: true
            });
        } else {
            logToFile('Sending verification link to Farmer...');
            await emailService.sendVerificationLink(email, link, name);
            logToFile('Verification link sent.');

            return res.status(201).json({
                message: 'Registration successful! Please check your email and click the verification link to activate your account.',
                success: true
            });
        }

    } catch (err) {
        logToFile(`Registration error: ${err.message}\n${err.stack}`);
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
};

// ─── GET /verify-email ────────────────────────────────────

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        if (!token) {
            return res.status(400).send('<h1 style="color: red; text-align: center;">Token missing</h1>');
        }

        const hashedToken = hashToken(token);
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE verification_token = ? AND token_expires_at > NOW()',
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).send('<h1 style="color: red; text-align: center;">Invalid or expired link.</h1>');
        }

        const user = users[0];

        // Update user: mark verified and set status to VERIFIED (for Farmers)
        // If it's a Field Expert clicking the link (if we sent it to them), it just verifies email.
        const newStatus = user.role === 'Field Expert' ? user.status : 'VERIFIED';

        await pool.execute(
            'UPDATE users SET is_verified = 1, status = ?, verification_token = NULL, token_expires_at = NULL WHERE id = ?',
            [newStatus, user.id]
        );

        res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0fdf4; padding: 40px; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; border: 1px solid #bbf7d0;">
                <h1 style="color: #166534; font-size: 28px;">✅ Verification Successful</h1>
                <p style="color: #1e293b; font-size: 18px; margin-top: 20px;">
                    Hi <strong>${user.name}</strong>, your email has been verified.
                </p>
                <p style="color: #475569; font-size: 16px;">
                    You can now return to the app and login to your account.
                </p>
                <div style="margin-top: 30px;">
                    <span style="background-color: #166534; color: white; padding: 10px 25px; border-radius: 6px; text-decoration: none; font-weight: bold;">Account Active</span>
                </div>
            </div>
        `);

    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).send('Server error during verification');
    }
};

exports.approveFieldExpert = async (req, res) => {
    const { userId } = req.body; // Expecting userId from admin panel

    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required', success: false });
        }

        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        const user = users[0];
        if (user.role !== 'Field Expert') {
            return res.status(400).json({ message: 'User is not a Field Expert', success: false });
        }

        await pool.execute(
            'UPDATE users SET status = "APPROVED", is_verified = 1 WHERE id = ?',
            [userId]
        );

        await emailService.sendExpertApprovalConfirmation(user.email, user.name);

        res.json({ message: 'Field Expert approved successfully', success: true });
    } catch (err) {
        console.error('Approval error:', err);
        res.status(500).json({ message: 'Server error during approval', success: false });
    }
};

// ─── GET /approve-expert-email (Admin clicks link from email) ──────

exports.approveFieldExpertViaEmail = async (req, res) => {
    const { token } = req.query;

    try {
        if (!token) {
            return res.status(400).send('<h1 style="color: red; text-align: center; margin-top: 50px;">Token missing. Invalid approval link.</h1>');
        }

        const hashedToken = hashToken(token);
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE verification_token = ?',
            [hashedToken]
        );

        if (users.length === 0) {
            // Token already used or invalid — check if expert was already approved
            const [approvedCheck] = await pool.execute(
                'SELECT * FROM users WHERE role = "Field Expert" AND status = "APPROVED" AND verification_token IS NULL ORDER BY created_at DESC LIMIT 1'
            );
            if (approvedCheck.length > 0) {
                return res.send(`
                    <div style="text-align: center; margin-top: 50px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #fef3c7; padding: 40px; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; border: 1px solid #fbbf24;">
                        <h1 style="color: #92400e; font-size: 28px;">⚠️ Already Processed</h1>
                        <p style="color: #78350f; font-size: 16px;">This approval link has already been used. The Field Expert account has been approved.</p>
                    </div>
                `);
            }
            return res.status(400).send(`
                <div style="text-align: center; margin-top: 50px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #fef2f2; padding: 40px; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; border: 1px solid #fca5a5;">
                    <h1 style="color: #991b1b; font-size: 28px;">❌ Invalid or Expired Link</h1>
                    <p style="color: #7f1d1d; font-size: 16px;">This approval link is invalid or has already been used.</p>
                </div>
            `);
        }

        const user = users[0];

        if (user.role !== 'Field Expert') {
            return res.status(400).send('<h1 style="color: red; text-align: center; margin-top: 50px;">This user is not a Field Expert.</h1>');
        }

        if (user.status === 'APPROVED') {
            return res.send(`
                <div style="text-align: center; margin-top: 50px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #fef3c7; padding: 40px; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; border: 1px solid #fbbf24;">
                    <h1 style="color: #92400e; font-size: 28px;">⚠️ Already Approved</h1>
                    <p style="color: #78350f; font-size: 16px;"><strong>${user.name}</strong> has already been approved.</p>
                </div>
            `);
        }

        // Approve the Field Expert
        await pool.execute(
            'UPDATE users SET status = "APPROVED", is_verified = 1, verification_token = NULL, token_expires_at = NULL WHERE id = ?',
            [user.id]
        );

        // Send approval confirmation email to the expert
        try {
            await emailService.sendExpertApprovalConfirmation(user.email, user.name);
        } catch (emailErr) {
            console.error('Error sending approval confirmation email:', emailErr);
        }

        res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0fdf4; padding: 40px; border-radius: 12px; max-width: 500px; margin-left: auto; margin-right: auto; border: 1px solid #bbf7d0;">
                <h1 style="color: #166534; font-size: 28px;">✅ Expert Approved Successfully</h1>
                <p style="color: #1e293b; font-size: 18px; margin-top: 20px;">
                    <strong>${user.name}</strong> (${user.email}) has been approved as a Field Expert.
                </p>
                <p style="color: #475569; font-size: 16px;">
                    They will receive a confirmation email and can now log in to CropShield.
                </p>
                <div style="margin-top: 30px;">
                    <span style="background-color: #166534; color: white; padding: 10px 25px; border-radius: 6px; font-weight: bold;">✔ Approved</span>
                </div>
            </div>
        `);

    } catch (err) {
        console.error('Email approval error:', err);
        res.status(500).send('<h1 style="color: red; text-align: center; margin-top: 50px;">Server error during approval. Please try again.</h1>');
    }
};

exports.rejectFieldExpert = async (req, res) => {
    const { userId } = req.body;

    try {
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required', success: false });
        }

        await pool.execute(
            'UPDATE users SET status = "REJECTED" WHERE id = ?',
            [userId]
        );

        res.json({ message: 'Field Expert account rejected', success: true });
    } catch (err) {
        console.error('Rejection error:', err);
        res.status(500).json({ message: 'Server error during rejection', success: false });
    }
};

// Simple listing for admin
exports.getPendingExperts = async (req, res) => {
    try {
        const [experts] = await pool.execute(
            'SELECT id, name, email, region, status, created_at FROM users WHERE role = "Field Expert" AND status = "PENDING_APPROVAL"'
        );
        res.json({ success: true, experts });
    } catch (err) {
        console.error('Fetch experts error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── POST /resend-verification-email ──────────────────────

exports.resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required.', success: false });
        }

        // 1. Check if user exists
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'No registration found for this email.', success: false });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({ message: 'This account is already active.', success: false });
        }

        // 2. Generate new token
        const rawToken = generateVerificationToken();
        const hashedToken = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await pool.execute(
            'UPDATE users SET verification_token = ?, token_expires_at = ? WHERE id = ?',
            [hashedToken, expiresAt, user.id]
        );

        // 3. Build link and Resend
        const link = buildLink(rawToken);

        if (user.role === 'Field Expert') {
            const approvalLink = buildLink(rawToken, '/api/auth/approve-expert-email');
            let adminEmail = 'viniththap@gmail.com';
            try {
                const [admins] = await pool.execute('SELECT email FROM admins WHERE id = "A001" LIMIT 1');
                if (admins.length > 0) adminEmail = admins[0].email;
            } catch (err) { console.error('Error fetching admin email:', err); }

            await emailService.sendApprovalRequestToAdmin(adminEmail, { name: user.name, email: user.email, region: user.region }, approvalLink);
        } else {
            await emailService.sendVerificationLink(email, link, user.name);
        }

        return res.status(200).json({ message: 'Verification link resent.', success: true });

    } catch (err) {
        console.error('Resend error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ─── POST /login ──────────────────────────────────────────

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password', success: false });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password', success: false });
        }

        if (user.role === 'Field Expert') {
            if (user.status === 'PENDING_APPROVAL') {
                return res.status(403).json({
                    message: 'Your account is pending admin approval.',
                    success: false
                });
            }
            if (user.status === 'REJECTED') {
                return res.status(403).json({
                    message: 'Your account registration has been rejected.',
                    success: false
                });
            }
            if (user.status !== 'APPROVED') {
                return res.status(403).json({
                    message: 'Your account is not active. Please wait for admin approval.',
                    success: false
                });
            }
        }

        if (user.role === 'Farmer' && (user.status === 'UNVERIFIED' || !user.is_verified)) {
            return res.status(403).json({
                message: 'Please verify your email address to activate your account.',
                success: false
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, region: user.region },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                region: user.region
            },
            success: true
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// ─── POST /forgot-password ────────────────────────────
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Email not found', success: false });
        }

        const user = users[0];
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        await pool.execute(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
            [email, hashedToken, expiresAt]
        );

        const resetLink = buildLink(rawToken, '/api/auth/reset-password-page');

        // Use general sendVerificationLink logic for reset too or specific one
        await emailService.sendPasswordResetEmail(email, user.name, resetLink);

        res.json({ message: 'Password reset link sent to your email.', success: true });
    } catch (err) {
        console.error('Forgot Password error:', err);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// ─── GET /reset-password-page (HTML for browser) ──────────────────
exports.resetPasswordPage = async (req, res) => {
    const { token } = req.query;
    res.send(`
        <div style="font-family: sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
            <h2 style="color: #166534;">Reset Password</h2>
            <form action="/api/auth/reset-password" method="POST">
                <input type="hidden" name="token" value="${token}">
                <div style="margin-bottom: 15px;">
                    <label>New Password:</label><br>
                    <input type="password" name="password" required style="width: 100%; padding: 8px; margin-top: 5px;">
                </div>
                <button type="submit" style="background: #166534; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Update Password</button>
            </form>
        </div>
    `);
};

// ─── POST /reset-password ────────────────────────────
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const hashedToken = hashToken(token);
        const [resets] = await pool.execute(
            'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
            [hashedToken]
        );

        if (resets.length === 0) {
            return res.status(400).send('<h1>Invalid or expired reset link.</h1>');
        }

        const resetRecord = resets[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, resetRecord.email]);
        await pool.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [resetRecord.id]);

        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
                <h2 style="color: #166534;">Password Updated Successfully!</h2>
                <p>You can now return to the app and login with your new password.</p>
            </div>
        `);
    } catch (err) {
        console.error('Reset Password error:', err);
        res.status(500).send('Server error during password reset.');
    }
};

// ─── GET /profile ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.execute(
            'SELECT id, name, email, role, region, username FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                region: user.region,
                username: user.username
            }
        });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Server error fetching profile', error: err.message });
    }
};

// ─── GET /admins ──────────────────────────────────────────
exports.getAdmins = async (req, res) => {
    try {
        const [admins] = await pool.execute('SELECT id, name, email FROM admins');
        res.json({
            success: true,
            admins: admins
        });
    } catch (err) {
        console.error('Admins fetch error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error fetching admin details',
            error: err.message
        });
    }
};
