-- ===============================================================================
-- CropShield Database - CORRECT Setup Matching Backend Code Exactly
-- ===============================================================================
-- This SQL matches the actual queries in:
--   backend/src/controllers/authController.js
--   backend/src/controllers/detectionController.js
-- ===============================================================================

DROP DATABASE IF EXISTS cropshield_db;
CREATE DATABASE cropshield_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cropshield_db;

-- -----------------------------------------------
-- 1. users table
-- Used by: authController (register/login/profile/approve/reject)
-- Columns match: id, name, username, email, password, role, region, is_verified, status
-- -----------------------------------------------
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('Farmer', 'Admin', 'Field Expert') DEFAULT 'Farmer',
    region VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'PENDING_APPROVAL', 'REJECTED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 2. email_verifications table
-- Used by: authController register (Farmer + Field Expert) and verifyEmail
-- Columns match: email, username, name, password, role, region, token, type, expires_at
-- -----------------------------------------------
CREATE TABLE email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Farmer', 'Admin', 'Field Expert') NOT NULL,
    region VARCHAR(100),
    token VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('VERIFICATION', 'APPROVAL') DEFAULT 'VERIFICATION',
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 3. password_resets table
-- Used by: authController forgotPassword and resetPassword
-- Columns match: email, token, expires_at, used
-- -----------------------------------------------
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 4. admins table
-- Used by: authController getAdmins, register (to notify admins)
-- Columns match: id, name, email
-- -----------------------------------------------
CREATE TABLE admins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 5. images table
-- Used by: detectionController createDetection, createBatchDetection
-- Backend inserts: ImageID, UserID, ImagePath, UploadDate
-- Backend queries: i.ImageID, i.ImagePath (via JOIN in getDetections)
-- -----------------------------------------------
CREATE TABLE images (
    ImageID VARCHAR(50) PRIMARY KEY,
    UserID VARCHAR(50) NOT NULL,
    ImagePath VARCHAR(500) NOT NULL,
    UploadDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 6. diseases table
-- Used by: detectionController (JOIN diseases dis ON d.disease_id = dis.DiseaseID)
-- Backend queries: dis.DiseaseID, dis.DiseaseName
-- Backend uses string IDs: 'dis-001' (Rice Blast), 'dis-003' (Brown Spot), 'dis-006' (Healthy)
-- -----------------------------------------------
CREATE TABLE diseases (
    DiseaseID VARCHAR(50) PRIMARY KEY,
    DiseaseName VARCHAR(255) NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 7. detections table
-- Used by: detectionController createDetection, createBatchDetection, getDetections
-- Backend inserts: id, user_id, ImageID, confidence, detected_at, disease_id
-- Batch also inserts: batch_id
-- All IDs are VARCHAR (UUID strings)
-- -----------------------------------------------
CREATE TABLE detections (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    batch_id VARCHAR(50),
    ImageID VARCHAR(50),
    confidence FLOAT,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    disease_id VARCHAR(50),
    INDEX idx_user_id (user_id),
    INDEX idx_detected_at (detected_at),
    INDEX idx_disease_id (disease_id),
    INDEX idx_batch_id (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 8. analysis table
-- Used by: detectionController createDetection, createBatchDetection, getDetections
-- Backend inserts: id, detection_id, analysis_date, Summary, rice_blast_prob, brown_spot_prob, other_prob, healthy_prob
-- Batch also inserts: unknown_prob
-- -----------------------------------------------
CREATE TABLE analysis (
    id VARCHAR(50) PRIMARY KEY,
    detection_id VARCHAR(50) NOT NULL,
    analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Summary TEXT,
    rice_blast_prob FLOAT DEFAULT 0,
    brown_spot_prob FLOAT DEFAULT 0,
    other_prob FLOAT DEFAULT 0,
    healthy_prob FLOAT DEFAULT 0,
    unknown_prob FLOAT DEFAULT 0,
    INDEX idx_detection_id (detection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 9. feedback table
-- Used by: detectionController submitFeedback, getFarmerFeedback
-- Backend inserts: sender_username, receiver_username, message
-- Backend queries: SELECT * FROM feedback WHERE receiver_username = ?
-- -----------------------------------------------
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_username VARCHAR(255) NOT NULL,
    receiver_username VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sender (sender_username),
    INDEX idx_receiver (receiver_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 10. batch_summaries table
-- Used by: detectionController createBatchDetection
-- Backend inserts: batch_id, avg_healthy, avg_rice_blast, avg_brown_spot, avg_unknown, final_assessment, created_at
-- -----------------------------------------------
CREATE TABLE batch_summaries (
    batch_id VARCHAR(50) PRIMARY KEY,
    avg_healthy FLOAT DEFAULT 0,
    avg_rice_blast FLOAT DEFAULT 0,
    avg_brown_spot FLOAT DEFAULT 0,
    avg_unknown FLOAT DEFAULT 0,
    final_assessment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===============================================================================
-- DUMMY DATA - All values match backend code expectations exactly
-- ===============================================================================

-- Password hash is bcrypt for 'password123' — $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- All users are pre-verified and ACTIVE for testing convenience

-- Users
INSERT INTO users (id, name, username, email, password, phone, role, region, is_verified, status) VALUES
('f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'Farmer John Doe',       'farmer_john',   'farmer@test.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543210', 'Farmer',       'Wet',          TRUE, 'ACTIVE'),
('e2d2c2b2-a2b2-42d2-a2b2-c2d2e2f2a2b2', 'Expert Dr. Sarah Smith','expert_sarah',  'expert@test.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543211', 'Field Expert', 'Intermediate', TRUE, 'ACTIVE'),
('a3b3c3d3-e3f3-43a3-b3c3-d3e3f3a3b3c3', 'Admin Vinitha',         'admin_vinitha', 'viniththap@gmail.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543212', 'Admin',       'Dry',          TRUE, 'ACTIVE'),
('r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'Farmer Raj Kumar',      'raj_farmer',    'raj@farmer.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9123456789', 'Farmer',       'Wet',          TRUE, 'ACTIVE'),
('m5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'Farmer Maria Garcia',   'maria_farmer',  'maria@farmer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9234567890', 'Farmer',       'Dry',          TRUE, 'ACTIVE'),
('c6h6e6n6-l6i6-46e6-x6p6-e6r6t6c6h6e6', 'Expert Prof. Chen Li',  'chen_expert',   'chen@expert.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9345678901', 'Field Expert', 'Intermediate', TRUE, 'ACTIVE'),
('v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'Farmer Vinay Kumar',    'vinay_farmer',  'vinay@farmer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9456789012', 'Farmer',       'Wet',          TRUE, 'ACTIVE'),
('l8i8s8a8-w8a8-48n8-g8e8-x8p8e8r8t8l8', 'Expert Dr. Lisa Wang',  'lisa_expert',   'lisa@expert.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9567890123', 'Field Expert', 'Dry',          TRUE, 'ACTIVE');

-- Admins (separate table queried by getAdmins and register for Field Expert notification)
INSERT INTO admins (id, name, email) VALUES
('A001', 'Admin Vinitha', 'viniththap@gmail.com');

-- Diseases (DiseaseID is VARCHAR string matching backend code: 'dis-001', 'dis-003', 'dis-006')
INSERT INTO diseases (DiseaseID, DiseaseName, symptoms, treatment, prevention) VALUES
('dis-001', 'Rice Blast',
 'Spindle-shaped spots on leaves, diamond-shaped lesions with gray centers and brown margins. Severe infections cause leaf death and reduced grain yield.',
 'Apply tricyclazole, isoprothiolane, or carbendazim fungicides. Remove infected parts and ensure proper drainage.',
 'Use resistant varieties, avoid excessive nitrogen, maintain proper spacing, practice crop rotation.'),
('dis-002', 'Bacterial Leaf Blight',
 'Water-soaked to yellowish stripes on leaf blades. Wilting and yellowing from tips downward. Entire leaves may dry out.',
 'Apply copper-based bactericides or streptomycin sulfate. Remove infected plants. Avoid overhead irrigation.',
 'Use certified disease-free seeds, proper water management, avoid excess nitrogen, good drainage.'),
('dis-003', 'Brown Spot',
 'Small circular to oval brown spots (2-10mm) with yellow halo on leaves. Spots may coalesce. Severely affected leaves appear scorched.',
 'Apply mancozeb, carbendazim, or propiconazole. Treat seeds with fungicides before planting.',
 'Use resistant varieties, balanced fertilization, proper soil fertility, good water management.'),
('dis-004', 'Leaf Scald',
 'Long narrow lesions with wavy margins starting from leaf tips. Alternating green and brown bands. Leaves may become completely blighted.',
 'Apply propiconazole or azoxystrobin. Remove infected debris after harvest.',
 'Plant resistant varieties, avoid shaded areas, proper spacing, good air circulation.'),
('dis-005', 'Sheath Blight',
 'Oval or elliptical greenish-gray lesions on leaf sheaths near water line. Lesions expand and merge causing sheath rot.',
 'Apply validamycin, hexaconazole, or tebuconazole. Drain fields periodically.',
 'Balanced fertilization, proper spacing, alternate wetting and drying, remove infected stubble.'),
('dis-006', 'Healthy Crop',
 'Bright green leaves with uniform color, strong upright stems, healthy white roots, vigorous growth. No visible spots or lesions.',
 'Continue regular monitoring and maintenance. Apply preventive measures as needed.',
 'Maintain balanced nutrition, proper water management, regular monitoring, crop rotation, certified seeds.');

-- Images (matching backend column names: ImageID, UserID, ImagePath, UploadDate)
INSERT INTO images (ImageID, UserID, ImagePath, UploadDate) VALUES
('img-001', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567890.jpg', '2024-02-01 10:30:00'),
('img-002', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567891.jpg', '2024-02-03 14:20:00'),
('img-003', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567892.jpg', '2024-02-05 09:15:00'),
('img-004', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567893.jpg', '2024-02-08 11:45:00'),
('img-005', 'r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'uploads/1643234567894.jpg', '2024-02-02 11:45:00'),
('img-006', 'r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'uploads/1643234567895.jpg', '2024-02-04 16:30:00'),
('img-007', 'r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'uploads/1643234567896.jpg', '2024-02-06 08:50:00'),
('img-008', 'm5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'uploads/1643234567897.jpg', '2024-02-07 08:50:00'),
('img-009', 'm5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'uploads/1643234567898.jpg', '2024-02-09 13:25:00'),
('img-010', 'm5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'uploads/1643234567899.jpg', '2024-02-10 15:40:00'),
('img-011', 'v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'uploads/1643234567900.jpg', '2024-02-11 09:20:00'),
('img-012', 'v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'uploads/1643234567901.jpg', '2024-02-12 14:15:00');

-- Detections (matching backend: id VARCHAR, user_id VARCHAR, ImageID VARCHAR, disease_id VARCHAR)
INSERT INTO detections (id, user_id, ImageID, confidence, detected_at, disease_id) VALUES
('det-001', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'img-001', 0.88, '2024-02-01 10:30:00', 'dis-001'),
('det-002', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'img-002', 0.95, '2024-02-03 14:20:00', 'dis-006'),
('det-003', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'img-003', 0.85, '2024-02-05 09:15:00', 'dis-002'),
('det-004', 'f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'img-004', 0.92, '2024-02-08 11:45:00', 'dis-006'),
('det-005', 'r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'img-005', 0.82, '2024-02-02 11:45:00', 'dis-003'),
('det-006', 'r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'img-006', 0.97, '2024-02-04 16:30:00', 'dis-006'),
('det-007', 'r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'img-007', 0.79, '2024-02-06 08:50:00', 'dis-001'),
('det-008', 'm5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'img-008', 0.86, '2024-02-07 08:50:00', 'dis-004'),
('det-009', 'm5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'img-009', 0.91, '2024-02-09 13:25:00', 'dis-005'),
('det-010', 'm5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'img-010', 0.84, '2024-02-10 15:40:00', 'dis-002'),
('det-011', 'v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'img-011', 0.90, '2024-02-11 09:20:00', 'dis-001'),
('det-012', 'v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'img-012', 0.96, '2024-02-12 14:15:00', 'dis-006');

-- Analysis (matching backend: id VARCHAR, detection_id VARCHAR, Summary, rice_blast_prob, etc.)
INSERT INTO analysis (id, detection_id, analysis_date, Summary, rice_blast_prob, brown_spot_prob, other_prob, healthy_prob, unknown_prob) VALUES
('ana-001', 'det-001', '2024-02-01 10:31:00', 'Rice Blast detected with high confidence',        88, 5, 2, 5, 0),
('ana-002', 'det-002', '2024-02-03 14:21:00', 'Healthy crop - no disease detected',               3, 2, 0, 95, 0),
('ana-003', 'det-003', '2024-02-05 09:16:00', 'Bacterial Leaf Blight detected',                   5, 5, 85, 5, 0),
('ana-004', 'det-004', '2024-02-08 11:46:00', 'Healthy crop - no disease detected',               2, 2, 4, 92, 0),
('ana-005', 'det-005', '2024-02-02 11:46:00', 'Brown Spot detected with moderate confidence',     8, 82, 5, 5, 0),
('ana-006', 'det-006', '2024-02-04 16:31:00', 'Healthy crop - no disease detected',               1, 1, 1, 97, 0),
('ana-007', 'det-007', '2024-02-06 08:51:00', 'Rice Blast detected',                              79, 8, 5, 8, 0),
('ana-008', 'det-008', '2024-02-07 08:51:00', 'Leaf Scald detected',                              5, 5, 86, 4, 0),
('ana-009', 'det-009', '2024-02-09 13:26:00', 'Sheath Blight detected',                           4, 4, 91, 1, 0),
('ana-010', 'det-010', '2024-02-10 15:41:00', 'Bacterial Leaf Blight detected',                   5, 5, 84, 6, 0),
('ana-011', 'det-011', '2024-02-11 09:21:00', 'Rice Blast detected with high confidence',         90, 3, 3, 4, 0),
('ana-012', 'det-012', '2024-02-12 14:16:00', 'Healthy crop - no disease detected',               1, 1, 2, 96, 0);

-- Feedback (matching backend: sender_username, receiver_username, message)
INSERT INTO feedback (sender_username, receiver_username, message, created_at) VALUES
('expert_sarah',  'farmer_john',  'Your Rice Blast detection was accurate. Apply tricyclazole fungicide immediately and ensure proper drainage.', '2024-02-01 12:00:00'),
('expert_sarah',  'farmer_john',  'Good that you detected Bacterial Leaf Blight early. Remove infected plants and avoid overhead irrigation.', '2024-02-05 15:30:00'),
('expert_sarah',  'raj_farmer',   'Brown Spot detection confirmed. Apply mancozeb fungicide and check soil fertility levels.', '2024-02-02 14:20:00'),
('chen_expert',   'maria_farmer', 'Leaf Scald identification is correct. Apply propiconazole and improve field sanitation.', '2024-02-07 10:15:00'),
('chen_expert',   'maria_farmer', 'Sheath Blight detected accurately. Drain fields periodically and apply validamycin.', '2024-02-09 16:00:00'),
('lisa_expert',   'vinay_farmer', 'Rice Blast detection confirmed. Use resistant varieties for next planting season.', '2024-02-11 11:30:00'),
('farmer_john',   'expert_sarah', 'Thank you for the advice on Rice Blast treatment. The fungicide is working well.', '2024-02-03 09:00:00'),
('raj_farmer',    'expert_sarah', 'Applied mancozeb as suggested. Condition is improving. Thanks!', '2024-02-04 10:30:00');

-- Verification
SELECT 'Database created successfully!' AS status;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'cropshield_db';
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS disease_count FROM diseases;
SELECT COUNT(*) AS detection_count FROM detections;
SELECT COUNT(*) AS analysis_count FROM analysis;
SELECT COUNT(*) AS feedback_count FROM feedback;
SELECT COUNT(*) AS image_count FROM images;
