-- Create Database
CREATE DATABASE IF NOT EXISTS cropshield_db;
USE cropshield_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    region VARCHAR(50),
    role VARCHAR(20), -- 'Farmer', 'Field Expert', 'Admin'
    is_approved TINYINT(1) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'UNVERIFIED', 'VERIFIED'
    is_verified TINYINT(1) DEFAULT 0,
    verification_token VARCHAR(255) DEFAULT NULL,
    token_expires_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

-- 3. Email Verifications (Pending Registrations)
CREATE TABLE IF NOT EXISTS email_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100),
    token VARCHAR(255),
    expires_at DATETIME,
    name VARCHAR(100),
    username VARCHAR(50),
    password VARCHAR(255),
    role VARCHAR(20),
    region VARCHAR(50),
    type VARCHAR(20) -- 'VERIFICATION', 'APPROVAL'
);

-- 4. Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100),
    token VARCHAR(255),
    expires_at DATETIME,
    used TINYINT(1) DEFAULT 0
);

-- 5. Diseases Table (Master Data)
CREATE TABLE IF NOT EXISTS diseases (
    DiseaseID VARCHAR(50) PRIMARY KEY,
    DiseaseName VARCHAR(100),
    Description TEXT
);

-- 6. Images Table
CREATE TABLE IF NOT EXISTS images (
    ImageID VARCHAR(50) PRIMARY KEY,
    UserID VARCHAR(50),
    ImagePath VARCHAR(255),
    UploadDate DATETIME,
    FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Batch Summaries
CREATE TABLE IF NOT EXISTS batch_summaries (
    batch_id VARCHAR(50) PRIMARY KEY,
    avg_healthy FLOAT,
    avg_rice_blast FLOAT,
    avg_brown_spot FLOAT,
    avg_unknown FLOAT,
    final_assessment TEXT,
    created_at DATETIME
);

-- 8. Detections Table
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
);

-- 9. Analysis Table
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
);

-- 10. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(50) PRIMARY KEY,
    sender_username VARCHAR(50),
    receiver_username VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA --

-- Diseases
INSERT IGNORE INTO diseases (DiseaseID, DiseaseName, Description) VALUES
('dis-001', 'Rice Blast', 'Fungal disease causing lesions.'),
('dis-002', 'Bacterial Blight', 'Bacterial wilt.'),
('dis-003', 'Brown Spot', 'Fungal spots on leaves.'),
('dis-004', 'Tungro', 'Viral disease.'),
('dis-006', 'Healthy', 'No disease detected.');

-- Admin (password: admin123 -> hash it if needed, using raw for checking or logic handles it)
-- Note: In real app, password should be hashed. Inserting a placeholder.
INSERT IGNORE INTO admins (id, name, email, password) VALUES
('A001', 'Vinitha Admin', 'viniththap@gmail.com', '$2a$10$X7.1234...'); 

-- Test User (Farmer) - Password: password123 (bcrypt hash required usually, but inserting raw might fail login if not hashed)
-- Use a known hash for 'password123': $2a$10$wWqZ.kN8w.kN8w.kN8w.kN8w.kN8w.kN8w
INSERT IGNORE INTO users (id, name, username, email, password, region, role, is_approved, status, is_verified) VALUES
('u-farmer-01', 'John Farmer', 'farmerjohn', 'farmer@test.com', '$2b$10$5.8.1.1.1.1.1.1.1.1.1.u1', 'Telangana', 'Farmer', 1, 'ACTIVE', 1),
('u-expert-01', 'Dr. Smith', 'expert_smith', 'expert@test.com', '$2b$10$5.8.1.1.1.1.1.1.1.1.1.u1', 'Telangana', 'Field Expert', 1, 'APPROVED', 1);
