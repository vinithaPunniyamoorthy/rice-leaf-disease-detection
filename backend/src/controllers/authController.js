const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const emailService = require('../services/emailService');

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
const buildVerificationLink = (rawToken) => {
    const baseUrl = process.env.FRONTEND_VERIFY_URL || 'http://localhost:5000/api/auth/verify-email';
    return `${baseUrl}?token=${rawToken}`;
};

// ─── POST /register ───────────────────────────────────────

exports.register = async (req, res) => {
    console.log('Registration/Approval request received:', req.body);
    let { name, email, password, role, region, username } = req.body;

    if (!name && username) name = username;

    try {
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required', success: false });
        }

        // 1. Check if user already exists in active users
        const [existing] = await pool.execute('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email or Username already exists', success: false });
        }

        // 2. Check if pending registration already exists
        const [pending] = await pool.execute('SELECT * FROM email_verifications WHERE email = ? OR username = ?', [email, username]);
        if (pending.length > 0) {
            return res.status(400).json({ message: 'A registration request for this user is already pending verification', success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const rawToken = generateVerificationToken();
        const hashedToken = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const type = role === 'Field Expert' ? 'APPROVAL' : 'VERIFICATION';

        // 3. Store in pending table
        await pool.execute(
            'INSERT INTO email_verifications (email, token, expires_at, name, username, password, role, region, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedToken, expiresAt, name, username, hashedPassword, role, region || null, type]
        );

        const link = type === 'APPROVAL'
            ? `${process.env.FRONTEND_VERIFY_URL}?token=${rawToken}&action=approve`
            : buildVerificationLink(rawToken);

        if (role === 'Field Expert') {
            // Send to Vinitha
            await emailService.sendApprovalRequestToAdmin('viniththap@gmail.com', { name, email, region }, link);
            return res.status(200).json({
                message: 'Approval request sent to Admin. You will be notified via email once approved.',
                success: true
            });
        } else {
            // Send to Farmer
            await emailService.sendVerificationLink(email, link, name);
            return res.status(200).json({
                message: 'Verification email sent. Please check your inbox to activate your account.',
                success: true
            });
        }

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
};

// ─── GET /verify-email ────────────────────────────────────

exports.verifyEmail = async (req, res) => {
    const { token, action } = req.query;

    try {
        if (!token) {
            return res.status(400).send('<h1 style="color: red; text-align: center;">Token missing</h1>');
        }

        const hashedToken = hashToken(token);
        const [verifications] = await pool.execute('SELECT * FROM email_verifications WHERE token = ?', [hashedToken]);

        if (verifications.length === 0) {
            return res.status(400).send('<h1 style="color: red; text-align: center;">Invalid or expired link</h1>');
        }

        const record = verifications[0];

        if (new Date(record.expires_at) < new Date()) {
            return res.status(400).send('<h1 style="color: red; text-align: center;">Link expired</h1>');
        }

        // Determine target status
        let status = 'ACTIVE';
        if (record.role === 'Field Expert') {
            if (action !== 'approve') {
                return res.status(400).send('<h1 style="text-align: center;">Field Expert accounts require Admin approval. Please wait for an admin to click the link.</h1>');
            }
            status = 'APPROVED';
        }

        // Create the user in main table
        const userId = uuidv4();
        await pool.execute(
            'INSERT INTO users (id, name, username, email, password, region, role, is_approved, status, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, record.name, record.username, record.email, record.password, record.region, record.role, (status === 'APPROVED' || record.role !== 'Field Expert'), status, 1]
        );

        // Cleanup
        await pool.execute('DELETE FROM email_verifications WHERE id = ?', [record.id]);

        if (record.role === 'Field Expert') {
            await emailService.sendExpertApprovalConfirmation(record.email, record.name);
        }

        res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: 'Segoe UI', Arial, sans-serif;">
                <h1 style="color: #1a7f37;">✅ ${record.role === 'Field Expert' ? 'Expert Account Approved!' : 'Email Verified Successfully!'}</h1>
                <p style="color: #4b5563; font-size: 16px;">The account for ${record.name} is now ${status.toLowerCase()}. You can now login.</p>
            </div>
        `);

    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).send('Server error during verification');
    }
};

// ─── POST /resend-verification-email ──────────────────────

exports.resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ message: 'Email is required.', success: false });
        }

        // 1. Check if user already exists
        const [usersList] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (usersList.length > 0) {
            return res.status(400).json({ message: 'This account is already active.', success: false });
        }

        // 2. Check if pending registration exists
        const [verifications] = await pool.execute(
            'SELECT * FROM email_verifications WHERE email = ? ORDER BY expires_at DESC LIMIT 1',
            [email]
        );

        if (verifications.length === 0) {
            return res.status(404).json({ message: 'No pending registration found for this email.', success: false });
        }

        const lastRecord = verifications[0];

        // 3. Cooldown check (2-minute cooldown)
        const cooldownEnd = new Date(new Date(lastRecord.expires_at).getTime() - 13 * 60 * 1000);
        if (new Date() < cooldownEnd) {
            const waitSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
            return res.status(429).json({ message: `Please wait ${waitSeconds} seconds.`, success: false });
        }

        // 4. Generate new token
        const rawToken = generateVerificationToken();
        const hashedToken = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await pool.execute('UPDATE email_verifications SET token = ?, expires_at = ? WHERE id = ?', [hashedToken, expiresAt, lastRecord.id]);

        // 5. Build link and Resend
        const type = lastRecord.role === 'Field Expert' ? 'APPROVAL' : 'VERIFICATION';
        const link = type === 'APPROVAL'
            ? `${process.env.FRONTEND_VERIFY_URL}?token=${rawToken}&action=approve`
            : buildVerificationLink(rawToken);

        if (type === 'APPROVAL') {
            await emailService.sendApprovalRequestToAdmin('viniththap@gmail.com', { name: lastRecord.name, email: lastRecord.email, region: lastRecord.region }, link);
        } else {
            await emailService.sendVerificationLink(email, link, lastRecord.name);
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
            // Check if it's a pending account
            const [pending] = await pool.execute('SELECT * FROM email_verifications WHERE email = ?', [email]);
            if (pending.length > 0) {
                const pUser = pending[0];
                const msg = pUser.role === 'Field Expert'
                    ? 'Your account is pending admin approval. Please wait for an email notification.'
                    : 'Please verify your email address to activate your account.';
                return res.status(403).json({ message: msg, success: false });
            }
            return res.status(401).json({ message: 'Invalid email or password', success: false });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password', success: false });
        }

        if (user.role === 'Field Expert' && user.status === 'PENDING_APPROVAL') {
            return res.status(403).json({
                message: 'Your account is pending admin approval. Please wait for an email notification.',
                success: false
            });
        }

        if (user.status === 'REJECTED') {
            return res.status(403).json({ message: 'Your account request was rejected.', success: false });
        }

        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email address to login.', success: false });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            process.env.JWT_SECRET || 'secret',
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
