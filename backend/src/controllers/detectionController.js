const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// 1. Image Upload & Detection
exports.createDetection = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Field cannot be empty', success: false });
    }

    const userId = req.user.id;
    const imagePath = req.file.path;
    const imageId = uuidv4();
    const detectionId = uuidv4();
    const analysisId = uuidv4();
    const now = new Date();

    try {
        // A. Insert into images Table
        await pool.execute(
            'INSERT INTO images (id, user_id, image_path, upload_date) VALUES (?, ?, ?, ?)',
            [imageId, userId, imagePath, now]
        );

        // B. Mock Detection Logic
        const modelId = 'model-002';
        await pool.execute(
            'INSERT INTO detections (id, user_id, image_path, confidence, detected_at) VALUES (?, ?, ?, ?, ?)',
            [detectionId, userId, imagePath, 0.9, now]
        );

        // C. Assign Disease
        const diseaseId = 1; // Rice Blast
        await pool.execute(
            'UPDATE detections SET disease_id = ? WHERE id = ?',
            [diseaseId, detectionId]
        );

        // D. Create Analysis Summary
        const summary = "Spindle-shaped spots on leaves detected. Diamond-shaped lesions with gray centers and brown margins present on nodes.";
        const riceBlastProb = Math.floor(Math.random() * 40) + 30; // 30-70%
        const brownSpotProb = Math.floor(Math.random() * 20) + 10; // 10-30%
        const otherProb = 100 - riceBlastProb - brownSpotProb;

        await pool.execute(
            'INSERT INTO analysis (id, detection_id, analysis_date, summary, rice_blast_prob, brown_spot_prob, unknown_prob) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [analysisId, detectionId, now, summary, riceBlastProb, brownSpotProb, otherProb]
        );

        res.status(201).json({
            message: 'Detection completed successfully',
            success: true,
            detectionId,
            imageId,
            analysisId,
            summary,
            probabilities: {
                'Rice Blast': riceBlastProb,
                'Brown Spot': brownSpotProb,
                'Other': otherProb
            }
        });
    } catch (err) {
        console.error('Detection Error:', err);
        res.status(500).json({ message: 'Server error during detection', error: err.message, success: false });
    }
};

// 2. Fetch User Detections
exports.getDetections = async (req, res) => {
    const userId = req.user.id;
    try {
        const [detections] = await pool.execute(
            `SELECT d.id, d.detected_at, d.image_path, dis.name as disease_name, a.summary, a.rice_blast_prob, a.brown_spot_prob, a.unknown_prob
             FROM detections d
             JOIN diseases dis ON d.disease_id = dis.id
             LEFT JOIN analysis a ON d.id = a.detection_id
             WHERE d.user_id = ?
             ORDER BY d.detected_at DESC`,
            [userId]
        );
        res.json({ success: true, detections });
    } catch (err) {
        console.error('Fetch Detections Error:', err);
        res.status(500).json({ message: 'Server error fetching history', success: false });
    }
};

// 3. Submit Feedback (Expert only)
exports.submitFeedback = async (req, res) => {
    const { recipient, message } = req.body;
    const sender = req.user.username; // Use username as requested

    if (!recipient || !message) {
        return res.status(400).json({ message: 'All field required', success: false });
    }

    try {
        const feedbackId = uuidv4();
        await pool.execute(
            'INSERT INTO feedback (sender_username, receiver_username, message) VALUES (?, ?, ?)',
            [sender, recipient, message]
        );

        res.status(201).json({
            message: 'Successfully Submitted',
            success: true
        });
    } catch (err) {
        console.error('Feedback Error:', err);
        res.status(500).json({ message: 'Server error submitting feedback', success: false });
    }
};

// 4. Get Farmer Feedback (Farmer only)
exports.getFarmerFeedback = async (req, res) => {
    const farmerUsername = req.user.username;
    try {
        const [feedback] = await pool.execute(
            `SELECT sender_username, message, created_at
             FROM feedback
             WHERE receiver_username = ?
             ORDER BY created_at DESC`,
            [farmerUsername]
        );
        res.json({ success: true, feedback });
    } catch (err) {
        console.error('Fetch Feedback Error:', err);
        res.status(500).json({ message: 'Server error fetching feedback', success: false });
    }
};

// 5. Farmer Analysis (Last 24h & 1y Summary)
exports.getFarmerAnalysis = async (req, res) => {
    let userId = req.user.id;
    let username = req.user.username;
    const targetUsername = req.query.username;

    if (targetUsername && req.user.role === 'Field Expert') {
        const [users] = await pool.execute('SELECT id, username FROM users WHERE username = ?', [targetUsername]);
        if (users.length > 0) {
            userId = users[0].id;
            username = users[0].username;
        } else {
            return res.status(404).json({ message: 'Farmer not found', success: false });
        }
    }

    try {
        // A. Last 24 Hours Analysis
        const [last24h] = await pool.execute(
            `SELECT a.rice_blast_prob, a.brown_spot_prob, d.detected_at, dis.name as disease_name,
             (CASE 
                WHEN dis.name = 'Rice Blast' THEN a.rice_blast_prob
                WHEN dis.name = 'Brown Spot' THEN a.brown_spot_prob
                ELSE a.healthy_prob
              END) as confidence
             FROM detections d
             LEFT JOIN analysis a ON d.batch_id = a.detection_id
             JOIN users u ON d.user_id = u.id
             JOIN diseases dis ON (
                CASE 
                    WHEN a.rice_blast_prob >= a.brown_spot_prob AND a.rice_blast_prob >= a.healthy_prob THEN 1 
                    WHEN a.brown_spot_prob >= a.rice_blast_prob AND a.brown_spot_prob >= a.healthy_prob THEN 3
                    ELSE 6
                END
             ) = dis.id
             WHERE d.user_id = ? AND d.detected_at >= NOW() - INTERVAL 1 DAY
             ORDER BY d.detected_at DESC`,
            [userId]
        );

        // B. Yearly Summary
        const [yearlyStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_detections,
                SUM(CASE WHEN dis.name = 'Rice Blast' THEN 1 ELSE 0 END) as rice_blast_count,
                SUM(CASE WHEN dis.name = 'Brown Spot' THEN 1 ELSE 0 END) as brown_spot_count
             FROM detections d
             JOIN analysis a ON d.batch_id = a.detection_id
             JOIN diseases dis ON (
                CASE 
                    WHEN a.rice_blast_prob >= a.brown_spot_prob AND a.rice_blast_prob >= a.healthy_prob THEN 1 
                    WHEN a.brown_spot_prob >= a.rice_blast_prob AND a.brown_spot_prob >= a.healthy_prob THEN 3
                    ELSE 6
                END
             ) = dis.id
             WHERE d.user_id = ? AND d.detected_at >= NOW() - INTERVAL 1 YEAR`,
            [userId]
        );

        res.json({
            success: true,
            username: username,
            last24h,
            summary: yearlyStats[0] || { total_detections: 0, rice_blast_count: 0, brown_spot_count: 0 }
        });
    } catch (err) {
        console.error('Farmer Analysis Error:', err);
        res.status(500).json({ message: 'Server error fetching analysis', success: false });
    }
};

// 6. Expert Analysis Dashboard (Region-based)
exports.getExpertAnalysisDashboard = async (req, res) => {
    const expertRegion = req.user.region;
    try {
        // A. Farmers in Region with activity in past 24h
        const [activeFarmers] = await pool.execute(
            `SELECT DISTINCT u.username
             FROM users u
             JOIN detections d ON u.id = d.user_id
             WHERE u.region = ? AND u.role = 'Farmer' 
             AND d.detected_at >= NOW() - INTERVAL 1 DAY`,
            [expertRegion]
        );

        // B. Regional Yearly Summary
        const [regionalStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_detections,
                SUM(CASE WHEN dis.name = 'Rice Blast' THEN 1 ELSE 0 END) as rice_blast_count,
                SUM(CASE WHEN dis.name = 'Brown Spot' THEN 1 ELSE 0 END) as brown_spot_count
             FROM detections d
             JOIN users u ON d.user_id = u.id
             JOIN analysis a ON d.batch_id = a.detection_id
             JOIN diseases dis ON (
                CASE 
                    WHEN a.rice_blast_prob >= a.brown_spot_prob AND a.rice_blast_prob >= a.healthy_prob THEN 1 
                    WHEN a.brown_spot_prob >= a.rice_blast_prob AND a.brown_spot_prob >= a.healthy_prob THEN 3
                    ELSE 6
                END
             ) = dis.id
             WHERE u.region = ? AND d.detected_at >= NOW() - INTERVAL 1 YEAR`,
            [expertRegion]
        );

        res.json({
            success: true,
            activeFarmers: activeFarmers.map(f => f.username),
            regionalSummary: regionalStats[0] || { total_detections: 0, rice_blast_count: 0, brown_spot_count: 0 }
        });
    } catch (err) {
        console.error('Expert Dashboard Error:', err);
        res.status(500).json({ message: 'Server error fetching expert dashboard', success: false });
    }
};
// 5. Batch Image Upload & Detection (5-Point Analysis)
exports.createBatchDetection = async (req, res) => {
    if (!req.files || req.files.length !== 5) {
        return res.status(400).json({
            message: 'Select five rice leaf images',
            success: false
        });
    }

    const userId = req.user.id;
    const batchId = uuidv4();
    const now = new Date();

    try {
        const results = [];
        let totalRiceBlast = 0;
        let totalBrownSpot = 0;
        let totalHealthy = 0;
        let totalUnknown = 0;

        for (const file of req.files) {
            const imageId = uuidv4();
            const detectionId = uuidv4();
            const analysisId = uuidv4();
            const imagePath = file.path;

            // A. Insert into images Table
            await pool.execute(
                'INSERT INTO images (id, user_id, image_path, upload_date) VALUES (?, ?, ?, ?)',
                [imageId, userId, imagePath, now]
            );

            // B. Mock Detection & Analysis (Same logic as individual detection)
            const riceBlastProb = Math.floor(Math.random() * 40) + 30; // 30-70%
            const brownSpotProb = Math.floor(Math.random() * 20) + 10; // 10-30%
            const healthyProb = Math.floor(Math.random() * 10) + 5;    // 5-15%
            const unknownProb = 100 - riceBlastProb - brownSpotProb - healthyProb;

            totalRiceBlast += riceBlastProb;
            totalBrownSpot += brownSpotProb;
            totalHealthy += healthyProb;
            totalUnknown += unknownProb;

            await pool.execute(
                'INSERT INTO detections (user_id, batch_id, image_path, confidence, detected_at) VALUES (?, ?, ?, ?, ?)',
                [userId, batchId, imagePath, riceBlastProb / 100, now]
            );

            // We follow the Analysis table structure if it exists
            await pool.execute(
                'INSERT INTO analysis (id, detection_id, analysis_date, summary, rice_blast_prob, brown_spot_prob, healthy_prob, unknown_prob) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [analysisId, batchId, now, "Batch image analysis", riceBlastProb, brownSpotProb, healthyProb, unknownProb]
            );

            results.push({
                imagePath,
                probabilities: {
                    'Rice Blast': riceBlastProb,
                    'Brown Spot': brownSpotProb,
                    'Healthy': healthyProb,
                    'Unknown': unknownProb
                }
            });
        }

        // C. Calculate Averages
        const avgRiceBlast = totalRiceBlast / 5;
        const avgBrownSpot = totalBrownSpot / 5;
        const avgHealthy = totalHealthy / 5;
        const avgUnknown = totalUnknown / 5;

        let finalAssessment = "Field condition is generally healthy.";
        if (avgRiceBlast > 40) finalAssessment = "Field condition: Serious Rice Blast threat detected.";
        else if (avgBrownSpot > 40) finalAssessment = "Field condition: Serious Brown Spot threat detected.";

        // D. Store Batch Summary
        await pool.execute(
            'INSERT INTO batch_summaries (batch_id, avg_healthy, avg_rice_blast, avg_brown_spot, avg_unknown, final_assessment) VALUES (?, ?, ?, ?, ?, ?)',
            [batchId, avgHealthy, avgRiceBlast, avgBrownSpot, avgUnknown, finalAssessment]
        );

        res.status(201).json({
            message: 'Batch detection completed successfully',
            success: true,
            batchId,
            results,
            averages: {
                'Average Healthy': avgHealthy,
                'Average Rice Blast': avgRiceBlast,
                'Average Brown Spot': avgBrownSpot,
                'Average Unknown': avgUnknown
            },
            finalAssessment
        });
    } catch (err) {
        console.error('Batch Detection Error:', err);
        res.status(500).json({ message: 'Server error during batch detection', error: err.message, success: false });
    }
};
