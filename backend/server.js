const fs = require('fs');

function logToFile(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('server_crash.log', `[${timestamp}] ${msg}\n`);
}

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    logToFile(`Uncaught Exception: ${err.message}\n${err.stack}`);
    process.exit(1);
});

logToFile('Starting server initialization...');

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const detectionRoutes = require('./src/routes/detectionRoutes');
const pool = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

logToFile('Modules loaded.');

// Auto-create tables on startup (safe for Railway fresh MySQL)
async function initDatabase() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20) DEFAULT NULL,
                role ENUM('Farmer','Admin','Field Expert') DEFAULT 'Farmer',
                region VARCHAR(100) DEFAULT NULL,
                is_verified TINYINT(1) DEFAULT 0,
                is_approved TINYINT(1) DEFAULT 0,
                status ENUM('ACTIVE','PENDING_APPROVAL','REJECTED','UNVERIFIED','VERIFIED','APPROVED') DEFAULT 'UNVERIFIED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                verification_token VARCHAR(255) DEFAULT NULL,
                token_expires_at DATETIME DEFAULT NULL
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255)
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100),
                token VARCHAR(255),
                expires_at DATETIME,
                used TINYINT(1) DEFAULT 0
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS diseases (
                DiseaseID VARCHAR(50) PRIMARY KEY,
                DiseaseName VARCHAR(100),
                Description TEXT
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS images (
                ImageID VARCHAR(50) PRIMARY KEY,
                UserID VARCHAR(50),
                ImagePath VARCHAR(255),
                UploadDate DATETIME,
                FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS batch_summaries (
                batch_id VARCHAR(50) PRIMARY KEY,
                avg_healthy FLOAT,
                avg_rice_blast FLOAT,
                avg_brown_spot FLOAT,
                avg_unknown FLOAT,
                final_assessment TEXT,
                created_at DATETIME
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS detections (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50),
                batch_id VARCHAR(50) NULL,
                ImageID VARCHAR(50),
                confidence FLOAT,
                detected_at DATETIME,
                disease_id VARCHAR(50),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (ImageID) REFERENCES images(ImageID) ON DELETE CASCADE,
                FOREIGN KEY (disease_id) REFERENCES diseases(DiseaseID)
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS analysis (
                id VARCHAR(50) PRIMARY KEY,
                detection_id VARCHAR(50),
                analysis_date DATETIME,
                Summary TEXT,
                rice_blast_prob FLOAT DEFAULT 0,
                brown_spot_prob FLOAT DEFAULT 0,
                other_prob FLOAT DEFAULT 0,
                healthy_prob FLOAT DEFAULT 0,
                unknown_prob FLOAT DEFAULT 0,
                FOREIGN KEY (detection_id) REFERENCES detections(id) ON DELETE CASCADE
            )
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS feedback (
                id VARCHAR(50) PRIMARY KEY,
                sender_username VARCHAR(50),
                receiver_username VARCHAR(50),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Seed diseases
        await pool.execute(`
            INSERT IGNORE INTO diseases (DiseaseID, DiseaseName, Description) VALUES
            ('dis-001', 'Rice Blast', 'Fungal disease causing lesions.'),
            ('dis-002', 'Bacterial Blight', 'Bacterial wilt.'),
            ('dis-003', 'Brown Spot', 'Fungal spots on leaves.'),
            ('dis-004', 'Tungro', 'Viral disease.'),
            ('dis-006', 'Healthy', 'No disease detected.')
        `);
        // Seed admin
        await pool.execute(`
            INSERT IGNORE INTO admins (id, name, email, password) VALUES
            ('A001', 'Vinitha Admin', 'viniththap@gmail.com', '$2a$10$placeholder')
        `);
        console.log('[DB] ✅ All tables verified/created successfully');
        logToFile('Database tables initialized successfully');
    } catch (err) {
        console.error('[DB] ❌ Error initializing database:', err.message);
        logToFile(`Database init error: ${err.message}`);
    }
}

initDatabase();

try {
    logToFile(`Environment: PORT=${PORT}, DB_HOST=${process.env.DB_HOST}`);
} catch (e) {
    logToFile(`Error access env: ${e.message}`);
}

// Middleware — allow ALL origins so mobile apps on any device can connect
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For HTML form POST (password reset)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/detections', detectionRoutes);

app.get('/', (req, res) => {
    res.send('CropShield API is running...');
});

// Health-check endpoint — shows DB status and masked env config
app.get('/health', async (req, res) => {
    const e = (k) => (process.env[k] || '').trim();
    const info = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT,
        env: {
            MYSQLHOST: e('MYSQLHOST') ? `${e('MYSQLHOST').substring(0, 12)}...` : 'NOT SET',
            MYSQLUSER: e('MYSQLUSER') || 'NOT SET',
            MYSQLDATABASE: e('MYSQLDATABASE') || 'NOT SET',
            MYSQLPORT: e('MYSQLPORT') || 'NOT SET',
            MYSQL_URL: e('MYSQL_URL') ? 'SET' : 'NOT SET',
            DATABASE_URL: e('DATABASE_URL') ? 'SET' : 'NOT SET',
            DB_HOST: e('DB_HOST') ? `${e('DB_HOST').substring(0, 12)}...` : 'NOT SET',
            DB_USER: e('DB_USER') || 'NOT SET',
            DB_NAME: e('DB_NAME') || 'NOT SET',
            DB_PORT: e('DB_PORT') || 'NOT SET',
            BASE_URL: e('BASE_URL') || 'NOT SET',
            JWT_SECRET: e('JWT_SECRET') ? 'SET' : 'NOT SET',
            GMAIL_USER: e('GMAIL_USER') || 'NOT SET',
            GMAIL_PASS: e('GMAIL_PASS') ? 'SET' : 'NOT SET',
        },
        db: 'checking...',
    };
    try {
        // Race the DB check against a 5-second timeout
        const dbCheck = pool.execute('SELECT 1 AS ok');
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('DB check timed out after 5s')), 5000));
        const [rows] = await Promise.race([dbCheck, timeout]);
        info.db = rows[0].ok === 1 ? 'connected' : 'unexpected';
    } catch (err) {
        info.db = `error: ${err.message}`;
        info.status = 'degraded';
    }
    res.json(info);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: err.message
    });
});


process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    logToFile(`Unhandled Rejection: ${err.message}`);
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (accessible on 0.0.0.0)`);
    logToFile(`Server started successfully on port ${PORT}`);
});

// Keep server alive
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
