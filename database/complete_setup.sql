-- ====================================================
-- CropShield Database - Complete Setup with Dummy Data
-- ====================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS cropshield_db;
CREATE DATABASE cropshield_db;
USE cropshield_db;

-- ====================================================
-- TABLE CREATION
-- ====================================================

-- Users Table (with region field)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('Farmer', 'Admin', 'Field Expert') DEFAULT 'Farmer',
    region VARCHAR(100),
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Diseases Table
CREATE TABLE diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Detections Table
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
    INDEX idx_detected_at (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Feedback Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====================================================
-- DUMMY DATA INSERTION
-- ====================================================

-- Insert Test Users with hashed password for 'password123'
-- Password hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (name, username, email, password, phone, role, region, is_approved) VALUES 
('Farmer John Doe', 'farmer_john', 'farmer@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543210', 'Farmer', 'Wet', TRUE),
('Expert Dr. Sarah Smith', 'expert_sarah', 'expert@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543211', 'Field Expert', 'Intermediate', TRUE),
('Admin User', 'admin_user', 'admin@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9876543212', 'Admin', 'Dry', TRUE),
('Farmer Raj Kumar', 'raj_farmer', 'raj@farmer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9123456789', 'Farmer', 'Wet', TRUE),
('Farmer Maria Garcia', 'maria_farmer', 'maria@farmer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9234567890', 'Farmer', 'Dry', TRUE),
('Expert Prof. Chen Li', 'chen_expert', 'chen@expert.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '9345678901', 'Field Expert', 'Intermediate', TRUE);

-- Insert Disease Data
INSERT INTO diseases (name, symptoms, treatment, prevention) VALUES 
('Rice Blast', 
 'Spindle-shaped spots on leaves, diamond-shaped lesions with gray centers and brown margins on nodes and panicles. Severe infections can cause leaf death.',
 'Apply tricyclazole, isoprothiolane, or carbendazim fungicides. Remove infected plant parts and ensure proper field drainage.',
 'Use resistant rice varieties, avoid excessive nitrogen fertilization, maintain proper plant spacing, and practice crop rotation.'),

('Bacterial Leaf Blight',
 'Water-soaked to yellowish stripes on leaf blades and leaf tips. Wilting and yellowing of leaves starting from the tips, progressing downwards.',
 'Apply copper-based bactericides or antibiotics like streptomycin. Remove and destroy infected plants to prevent spread.',
 'Use certified disease-free seeds, maintain proper water management, avoid excessive nitrogen, and ensure good field drainage.'),

('Brown Spot',
 'Small, circular to oval brown spots with a yellow halo on leaves and glumes. Spots may coalesce to form larger lesions.',
 'Apply fungicides containing mancozeb, carbendazim, or propiconazole. Treat seeds with fungicides before planting.',
 'Use resistant varieties, ensure balanced fertilization (avoid nitrogen excess), maintain proper soil fertility, and practice good water management.'),

('Leaf Scald',
 'Long, narrow lesions with wavy margins. Lesions start from leaf tips and spread downward with alternating green and brown bands.',
 'Apply systemic fungicides and remove infected plant debris. Improve field sanitation.',
 'Plant resistant varieties, avoid planting in shaded areas, ensure proper spacing, and maintain good air circulation.'),

('Sheath Blight',
 'Oval or elliptical greenish-gray lesions on leaf sheaths near the water line. Lesions expand and merge, causing the entire sheath to rot.',
 'Apply validamycin, hexaconazole, or tebuconazole fungicides. Drain fields to reduce humidity.',
 'Maintain balanced fertilization, avoid overfertilization with nitrogen, ensure proper plant spacing, and practice alternate wetting and drying.'),

('Healthy Crop',
 'Bright green leaves with uniform color, strong stems, healthy root system. No visible spots, lesions, or discoloration.',
 'Continue regular monitoring and maintenance. Apply preventive measures as needed.',
 'Maintain balanced nutrition, proper water management, regular field monitoring, crop rotation, and use of certified quality seeds.');

-- Insert Sample Detection History
INSERT INTO detections (user_id, image_path, disease_id, confidence, detected_at) VALUES 
(1, 'uploads/1643234567890.jpg', 1, 0.88, '2024-01-15 10:30:00'),
(1, 'uploads/1643234567891.jpg', 6, 0.95, '2024-01-16 14:20:00'),
(1, 'uploads/1643234567892.jpg', 2, 0.85, '2024-01-17 09:15:00'),
(4, 'uploads/1643234567893.jpg', 3, 0.82, '2024-01-18 11:45:00'),
(4, 'uploads/1643234567894.jpg', 6, 0.97, '2024-01-19 16:30:00'),
(5, 'uploads/1643234567895.jpg', 4, 0.79, '2024-01-20 08:50:00'),
(5, 'uploads/1643234567896.jpg', 5, 0.91, '2024-01-21 13:25:00');

-- Insert Sample Feedback
INSERT INTO feedback (detection_id, user_id, comment, rating, created_at) VALUES 
(1, 2, 'Accurate detection. Treatment recommendations are helpful.', 5, '2024-01-15 12:00:00'),
(3, 2, 'Good identification. Consider adding more prevention tips.', 4, '2024-01-17 15:30:00'),
(4, 3, 'Detection seems accurate. Farmer should follow the treatment plan.', 5, '2024-01-18 14:20:00'),
(6, 6, 'Verified by expert. Disease identification is correct.', 5, '2024-01-20 10:15:00');

-- ====================================================
-- GRANT PRIVILEGES
-- ====================================================
GRANT ALL PRIVILEGES ON cropshield_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- ====================================================
-- VERIFICATION QUERIES
-- ====================================================
SELECT 'Database setup completed successfully!' AS Status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_diseases FROM diseases;
SELECT COUNT(*) AS total_detections FROM detections;
SELECT COUNT(*) AS total_feedback FROM feedback;

-- Display sample data
SELECT id, name, email, role, region FROM users;
SELECT id, name FROM diseases;
