const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    createDetection,
    getDetections,
    submitFeedback,
    getFarmerFeedback,
    createBatchDetection,
    getFarmerAnalysis,
    getExpertAnalysisDashboard
} = require('../controllers/detectionController');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/', auth, upload.single('image'), createDetection);
router.post('/batch', auth, upload.array('images', 5), createBatchDetection);
router.get('/', auth, getDetections);
router.post('/feedback', auth, submitFeedback);
router.get('/feedback', auth, getFarmerFeedback);
router.get('/analysis', auth, getFarmerAnalysis);
router.get('/expert/dashboard', auth, getExpertAnalysisDashboard);

module.exports = router;
