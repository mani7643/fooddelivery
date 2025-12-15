
import express from 'express';
// Minimal Debug Route to diagnose server crash
const router = express.Router();

// @route   GET /api/driver-debug/ping
// @desc    Simple reachability check
// @access  Public
router.get('/ping', (req, res) => {
    res.send('pong');
});

export default router;
