CREATE DATABASE IF NOT EXISTS cropshield_db;
USE cropshield_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('farmer', 'admin', 'expert') DEFAULT 'farmer',
    region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT
);

CREATE TABLE IF NOT EXISTS detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    image_path VARCHAR(255),
    disease_id INT,
    confidence FLOAT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (disease_id) REFERENCES diseases(id)
);

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    detection_id INT,
    user_id INT,
    comment TEXT,
    rating INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (detection_id) REFERENCES detections(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Initial Data
INSERT INTO diseases (name, symptoms, treatment, prevention) VALUES 
('Rice Blast', 'Spindle-shaped spots on leaves, nodes, and panicles.', 'Apply tricyclazole or carbendazim.', 'Use resistant varieties and avoid high nitrogen.'),
('Bacterial Leaf Blight', 'Yellowing and wilting of leaves from tips downwards.', 'Copper-based fungicides.', 'Clean cultivation and proper drainage.'),
('Brown Spot', 'Small oval brown spots on leaves.', 'Seed treatment with fungicides.', 'Balanced fertilization.'),
('Healthy Crop', 'Green leaves, no signs of disease.', 'Continue normal maintenance.', 'Regular monitoring.');
