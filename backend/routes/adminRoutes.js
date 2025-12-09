import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// @route   GET /api/admin/pending-verifications
// @desc    Get all drivers pending verification
// @access  Private (Admin only)
router.get('/pending-verifications', protect, authorize('admin'), async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: 'pending_verification'
        }).populate('userId', 'name email phone');

        res.json({ success: true, drivers });
    } catch (error) {
        console.error('Get pending verifications error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/verify-driver/:driverId
// @desc    Verify or reject driver
// @access  Private (Admin only)
router.put('/verify-driver/:driverId', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, notes } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be "verified" or "rejected"' });
        }

        const driver = await Driver.findById(req.params.driverId).populate('userId', 'name email');
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update driver verification status
        driver.verificationStatus = status;
        driver.verificationNotes = notes || '';
        driver.verifiedAt = new Date();
        driver.verifiedBy = req.user._id;

        await driver.save();

        // Send email if approved
        if (status === 'verified') {
            await notificationService.sendVerificationApprovalEmail(
                driver.userId.email,
                driver.userId.name
            );
            console.log(`✅ Driver ${driver.userId.name} verified and email sent`);
        }

        res.json({
            success: true,
            message: `Driver ${status === 'verified' ? 'approved' : 'rejected'} successfully`,
            driver
        });
    } catch (error) {
        console.error('Verify driver error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/drivers
// @desc    Get all drivers with filters
// @access  Private (Admin only)
router.get('/drivers', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { verificationStatus: status } : {};

        const drivers = await Driver.find(filter)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, drivers });
    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
