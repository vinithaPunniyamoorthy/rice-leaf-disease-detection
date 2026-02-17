USE cropshield_db_v2;

-- 1. Ensure plural lowercase
RENAME TABLE user TO users;
RENAME TABLE User TO users;
RENAME TABLE detection TO detections;
RENAME TABLE Detection TO detections;
RENAME TABLE Analysis TO analysis;
RENAME TABLE Feedback TO feedback;
RENAME TABLE Disease TO diseases;
RENAME TABLE disease TO diseases;
RENAME TABLE image TO images;
RENAME TABLE Image TO images;
RENAME TABLE admin TO admins;
RENAME TABLE Admin TO admins;

-- 2. Create missing tables
CREATE TABLE IF NOT EXISTS batch_summaries (
    batch_id VARCHAR(50) PRIMARY KEY,
    avg_healthy FLOAT,
    avg_rice_blast FLOAT,
    avg_brown_spot FLOAT,
    avg_unknown FLOAT,
    final_assessment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Ensure columns exist (Redundant but safe)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) AFTER id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE AFTER role;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0;

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS sender_username VARCHAR(255) AFTER id;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS receiver_username VARCHAR(255) AFTER sender_username;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS message TEXT AFTER receiver_username;

-- 4. Seed Diseases if empty
INSERT IGNORE INTO diseases (id, name) VALUES 
(1, 'Rice Blast'),
(2, 'Bacterial Leaf Blight'),
(3, 'Brown Spot'),
(4, 'Leaf Scald'),
(5, 'Sheath Blight'),
(6, 'Healthy');
