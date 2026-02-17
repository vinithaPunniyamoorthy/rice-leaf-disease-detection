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

const app = express();
const PORT = process.env.PORT || 5000;

logToFile('Modules loaded.');

try {
    logToFile(`Environment: PORT=${PORT}, DB_HOST=${process.env.DB_HOST}`);
} catch (e) {
    logToFile(`Error access env: ${e.message}`);
}

// Middleware
app.use(cors());
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
