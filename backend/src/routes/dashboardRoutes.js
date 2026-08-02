const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All dashboard endpoints require authentication
router.use(authMiddleware);

router.get('/summary', getDashboardSummary);

module.exports = router;
