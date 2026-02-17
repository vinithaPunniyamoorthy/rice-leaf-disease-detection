USE cropshield_db;

-- Ensure users for testing
INSERT IGNORE INTO users (name, email, password, phone, role, region) VALUES 
('Farmer John', 'farmer@test.com', '$2a$10$X.fA4K6nF9nXZpQn5XkOQ.Vv1ZJ7V5Y/q5W3W5N7pW7Y7pW7Y7pW7', '1234567890', 'farmer', 'Wet'),
('Expert Smith', 'expert@test.com', '$2a$10$X.fA4K6nF9nXZpQn5XkOQ.Vv1ZJ7V5Y/q5W3W5N7pW7Y7pW7Y7pW7', '0987654321', 'expert', 'Intermediate'),
('Admin User', 'admin@test.com', '$2a$10$X.fA4K6nF9nXZpQn5XkOQ.Vv1ZJ7V5Y/q5W3W5N7pW7Y7pW7Y7pW7', '1122334455', 'admin', 'Dry');

-- Note: The password above is a hash for 'password123' (mocked bcrypt hash)
-- In a real scenario, you'd use the actual hash.

-- Ensure diseases exist
INSERT IGNORE INTO diseases (id, name, symptoms, treatment, prevention) VALUES 
(1, 'Rice Blast', 'Spindle-shaped spots on leaves, nodes, and panicles.', 'Apply tricyclazole or carbendazim.', 'Use resistant varieties and avoid high nitrogen.'),
(2, 'Bacterial Leaf Blight', 'Yellowing and wilting of leaves from tips downwards.', 'Copper-based fungicides.', 'Clean cultivation and proper drainage.'),
(3, 'Brown Spot', 'Small oval brown spots on leaves.', 'Seed treatment with fungicides.', 'Balanced fertilization.'),
(4, 'Healthy Crop', 'Green leaves, no signs of disease.', 'Continue normal maintenance.', 'Regular monitoring.');

-- Grant full privileges
GRANT ALL PRIVILEGES ON cropshield_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
