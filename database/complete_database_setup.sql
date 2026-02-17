-- ===============================================================================
-- CropShield Database - Complete Setup with ALL Required Tables & Dummy Data
-- ===============================================================================
-- This script creates the complete database schema including all tables needed
-- for authentication, email verification, password reset, and disease detection
-- ===============================================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS cropshield_db;
CREATE DATABASE cropshield_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cropshield_db;

-- ===============================================================================
-- TABLE CREATION
-- ===============================================================================

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('Farmer', 'Admin', 'Field Expert') DEFAULT 'Farmer',
    region VARCHAR(100),
    is_approved BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'PENDING_APPROVAL', 'REJECTED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Email Verifications Table (for storing pending registrations)
-- Schema matches authController implementation with all user data
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

-- 3. Password Resets Table (for forgot password functionality)
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

-- 4. Admins Table (for admin users referenced in authController)
CREATE TABLE admins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Detections Table
CREATE TABLE detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    disease_id INT,
    confidence FLOAT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_detected_at (detected_at),
    INDEX idx_disease_id (disease_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Feedback Table
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    detection_id INT,
    user_id INT NOT NULL,
    comment TEXT,
    rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detection_id) REFERENCES detections(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_detection_id (detection_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================================================
-- DUMMY DATA INSERTION
-- ===============================================================================

-- Insert Test Users with hashed password for 'password123'
-- Password hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- All users are email_verified=TRUE and is_verified=TRUE for easy testing

INSERT INTO users (id, name, username, email, password, phone, role, region, is_approved, email_verified, is_verified, status) VALUES 
('f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'Farmer John Doe', 'farmer_john', 'farmer@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543210', 'Farmer', 'Wet', TRUE, TRUE, TRUE, 'ACTIVE'),
('e2d2c2b2-a2b2-42d2-a2b2-c2d2e2f2a2b2', 'Expert Dr. Sarah Smith', 'expert_sarah', 'expert@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543211', 'Field Expert', 'Intermediate', TRUE, TRUE, TRUE, 'ACTIVE'),
('a3b3c3d3-e3f3-43a3-b3c3-d3e3f3a3b3c3', 'Admin User', 'admin_user', 'admin@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543212', 'Admin', 'Dry', TRUE, TRUE, TRUE, 'ACTIVE'),
('r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'Farmer Raj Kumar', 'raj_farmer', 'raj@farmer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9123456789', 'Farmer', 'Wet', TRUE, TRUE, TRUE, 'ACTIVE'),
('m5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'Farmer Maria Garcia', 'maria_farmer', 'maria@farmer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9234567890', 'Farmer', 'Dry', TRUE, TRUE, TRUE, 'ACTIVE'),
('c6h6e6n6-l6i6-46e6-x6p6-e6r6t6c6h6e6', 'Expert Prof. Chen Li', 'chen_expert', 'chen@expert.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9345678901', 'Field Expert', 'Intermediate', TRUE, TRUE, TRUE, 'ACTIVE'),
('v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'Farmer Vinay Kumar', 'vinay_farmer', 'vinay@farmer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9456789012', 'Farmer', 'Wet', TRUE, TRUE, TRUE, 'ACTIVE'),
('l8i8s8a8-w8a8-48n8-g8e8-x8p8e8r8t8l8', 'Expert Dr. Lisa Wang', 'lisa_expert', 'lisa@expert.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9567890123', 'Field Expert', 'Dry', TRUE, TRUE, TRUE, 'ACTIVE');

-- Insert Admin Data
INSERT INTO admins (id, name, email) VALUES 
('A001', 'Admin Vinitha', 'viniththap@gmail.com');

-- Insert Disease Data with comprehensive information
INSERT INTO diseases (name, symptoms, treatment, prevention) VALUES 
('Rice Blast', 
 'Spindle-shaped spots on leaves, diamond-shaped lesions with gray centers and brown margins on nodes and panicles. Severe infections can cause leaf death and reduced grain yield.',
 'Apply tricyclazole, isoprothiolane, or carbendazim fungicides at recommended rates. Remove infected plant parts and ensure proper field drainage. Apply fungicides at booting and heading stages.',
 'Use resistant rice varieties, avoid excessive nitrogen fertilization, maintain proper plant spacing (20x20cm or 25x25cm), practice crop rotation, and use certified disease-free seeds.'),

('Bacterial Leaf Blight',
 'Water-soaked to yellowish stripes on leaf blades and leaf tips. Wilting and yellowing of leaves starting from the tips, progressing downwards. In severe cases, entire leaves may dry out (kresek phase).',
 'Apply copper-based bactericides (copper oxychloride) or antibiotics like streptomycin sulfate. Remove and destroy infected plants immediately to prevent spread. Avoid overhead irrigation.',
 'Use certified disease-free seeds, maintain proper water management (avoid continuous flooding), avoid excessive nitrogen, ensure good field drainage, and clip leaf tips before transplanting.'),

('Brown Spot',
 'Small, circular to oval brown spots (2-10mm) with a yellow halo on leaves and glumes. Spots may coalesce to form larger lesions. Severely affected leaves appear scorched.',
 'Apply fungicides containing mancozeb, carbendazim, or propiconazole. Treat seeds with fungicides (thiram or carbendazim) before planting. Apply foliar sprays at 10-day intervals.',
 'Use resistant varieties, ensure balanced fertilization (avoid nitrogen excess and potassium deficiency), maintain proper soil fertility, practice good water management, and use healthy seeds.'),

('Leaf Scald',
 'Long, narrow lesions with wavy margins. Lesions start from leaf tips and spread downward with alternating green and brown bands (zonate pattern). Leaves may become completely blighted.',
 'Apply systemic fungicides (propiconazole, azoxystrobin) and remove infected plant debris after harvest. Improve field sanitation by burning stubble.',
 'Plant resistant varieties, avoid planting in shaded areas, ensure proper spacing (avoid overcrowding), maintain good air circulation, and practice field sanitation.'),

('Sheath Blight',
 'Oval or elliptical greenish-gray lesions on leaf sheaths near the water line. Lesions expand and merge, causing the entire sheath to rot. In severe cases, infection reaches the flag leaf.',
 'Apply validamycin, hexaconazole, or tebuconazole fungicides. Drain fields periodically to reduce humidity. Apply fungicides at maximum tillering to booting stage.',
 'Maintain balanced fertilization (avoid excess nitrogen), ensure proper plant spacing, practice alternate wetting and drying (AWD), remove infected stubble, and use silicon fertilizers.'),

('Healthy Crop',
 'Bright green leaves with uniform color, strong upright stems, healthy white roots, vigorous growth. No visible spots, lesions, discoloration, or wilting. Good tillering and panicle development.',
 'Continue regular monitoring and maintenance. Apply preventive measures as needed. Maintain optimal nutrition and water management.',
 'Maintain balanced nutrition (NPK + micronutrients), proper water management (AWD method), regular field monitoring for pests and diseases, crop rotation, use of certified quality seeds, and timely cultural practices.');

-- Insert Sample Detection History (spread across multiple farmers)
INSERT INTO detections (user_id, image_path, disease_id, confidence, detected_at) VALUES 
-- Farmer John's detections
('f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567890.jpg', 1, 0.88, '2024-02-01 10:30:00'),
('f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567891.jpg', 6, 0.95, '2024-02-03 14:20:00'),
('f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567892.jpg', 2, 0.85, '2024-02-05 09:15:00'),
('f1e1d1c1-b1a1-41e1-b1c1-d1e1f1a1b1c1', 'uploads/1643234567893.jpg', 6, 0.92, '2024-02-08 11:45:00'),

-- Raj's detections
('r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'uploads/1643234567894.jpg', 3, 0.82, '2024-02-02 11:45:00'),
('r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'uploads/1643234567895.jpg', 6, 0.97, '2024-02-04 16:30:00'),
('r4a4j4k4-u4m4-44a4-r4f4-a4r4m4e4r4k4', 'uploads/1643234567896.jpg', 1, 0.79, '2024-02-06 08:50:00'),

-- Maria's detections
('m5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'uploads/1643234567897.jpg', 4, 0.86, '2024-02-07 08:50:00'),
('m5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'uploads/1643234567898.jpg', 5, 0.91, '2024-02-09 13:25:00'),
('m5a5r5i5-a5g5-45a5-r5c5-i5a5f5a5r5m5', 'uploads/1643234567899.jpg', 2, 0.84, '2024-02-10 15:40:00'),

-- Vinay's detections
('v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'uploads/1643234567900.jpg', 1, 0.90, '2024-02-11 09:20:00'),
('v7i7n7a7-y7k7-47u7-m7a7-r7f7a7r7m7e7', 'uploads/1643234567901.jpg', 6, 0.96, '2024-02-12 14:15:00');

-- Insert Sample Feedback from experts
INSERT INTO feedback (detection_id, user_id, comment, rating, created_at) VALUES 
(1, 'e2d2c2b2-a2b2-42d2-a2b2-c2d2e2f2a2b2', 'Accurate detection of Rice Blast. The treatment recommendations are helpful. Farmer should apply fungicides immediately to prevent further spread.', 5, '2024-02-01 12:00:00'),
(3, 'e2d2c2b2-a2b2-42d2-a2b2-c2d2e2f2a2b2', 'Good identification of Bacterial Leaf Blight. Consider adding more prevention tips. Recommend removing infected plants and improving drainage.', 4, '2024-02-05 15:30:00'),
(5, 'e2d2c2b2-a2b2-42d2-a2b2-c2d2e2f2a2b2', 'Detection confidence is good. The brown spot symptoms are clearly visible. Follow the treatment plan and ensure balanced fertilization.', 5, '2024-02-02 14:20:00'),
(8, 'c6h6e6n6-l6i6-46e6-x6p6-e6r6t6c6h6e6', 'Verified by expert. Leaf Scald identification is correct. Farmer should improve field sanitation and apply systemic fungicides.', 5, '2024-02-07 10:15:00'),
(9, 'c6h6e6n6-l6i6-46e6-x6p6-e6r6t6c6h6e6', 'Sheath Blight detected accurately. Critical to drain fields and reduce humidity. Apply validamycin fungicides at recommended rates.', 5, '2024-02-09 16:00:00'),
(11, 'l8i8s8a8-w8a8-48n8-g8e8-x8p8e8r8t8l8', 'Rice Blast detection confirmed. High confidence score is appropriate. Immediate action required to protect the crop.', 5, '2024-02-11 11:30:00');

-- ===============================================================================
-- GRANT PRIVILEGES
-- ===============================================================================

GRANT ALL PRIVILEGES ON cropshield_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- ===============================================================================
-- VERIFICATION QUERIES
-- ===============================================================================

SELECT '✅ Database setup completed successfully!' AS Status;
SELECT '';
SELECT '📊 TABLE COUNTS:' AS Info;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_diseases FROM diseases;
SELECT COUNT(*) AS total_detections FROM detections;
SELECT COUNT(*) AS total_feedback FROM feedback;
SELECT '';
SELECT '👥 TEST USERS (All passwords: password123):' AS Info;
SELECT id, name, email, role, region, email_verified, is_approved FROM users;
SELECT '';
SELECT '🦠 DISEASES:' AS Info;
SELECT id, name FROM diseases;
SELECT '';
SELECT '📸 SAMPLE DETECTIONS:' AS Info;
SELECT COUNT(*) as total_detections, user_id, 
       (SELECT name FROM users WHERE id = detections.user_id) as farmer_name
FROM detections 
GROUP BY user_id;
SELECT '';
SELECT '💬 FEEDBACK SUMMARY:' AS Info;
SELECT COUNT(*) as total_feedback, AVG(rating) as avg_rating FROM feedback;
SELECT '';
SELECT '✅ ALL TABLES CREATED:' AS Status;
SHOW TABLES;
