import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import { fileURLToPath } from 'url';

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

        // Send email notification
        if (status === 'verified') {
            await notificationService.sendVerificationApprovalEmail(
                driver.userId.email,
                driver.userId.name
            );
            console.log(`✅ Driver ${driver.userId.name} verified and email sent`);
        } else if (status === 'rejected') {
            await notificationService.sendVerificationRejectionEmail(
                driver.userId.email,
                driver.userId.name,
                notes
            );
            console.log(`❌ Driver ${driver.userId.name} rejected and email sent`);
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

// @route   GET /api/admin/pending-admins
// @desc    Get all admins pending approval
// @access  Private (Admin only)
router.get('/pending-admins', protect, authorize('admin'), async (req, res) => {
    try {
        const admins = await User.find({
            role: 'admin',
            accountStatus: 'pending'
        }).select('-password');

        res.json({ success: true, admins });
    } catch (error) {
        console.error('Get pending admins error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/approve-admin/:userId
// @desc    Approve admin account
// @access  Private (Admin only)
router.put('/approve-admin/:userId', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ message: 'User is not an admin' });
        }

        user.accountStatus = 'active';
        await user.save();

        // Send email notification (optional)
        // await notificationService.sendAdminApprovalEmail(user.email, user.name);

        res.json({
            success: true,
            message: 'Admin account approved successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus
            }
        });
    } catch (error) {
        console.error('Approve admin error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/debug-files
// @desc    Debug endpoint to list files in uploads directory
// @access  Public (Temporary for debugging) - verify it is protected in prod
router.get('/debug-files', async (req, res) => {
    try {
        const fs = await import('fs');
        const path = await import('path');
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Navigate from routes/adminRoutes.js to backend/uploads
        const uploadsDir = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadsDir)) {
            return res.json({ message: 'Uploads directory does not exist', path: uploadsDir });
        }

        const getFiles = (dir) => {
            const dirents = fs.readdirSync(dir, { withFileTypes: true });
            const files = dirents.map((dirent) => {
                const res = path.resolve(dir, dirent.name);
                return dirent.isDirectory() ? getFiles(res) : res;
            });
            return Array.prototype.concat(...files);
        };

        const files = getFiles(uploadsDir);
        // Clean paths to be relative to uploads
        const relativeFiles = files.map(f => f.split('uploads')[1]);

        res.json({
            message: 'List of files in uploads',
            uploadPath: uploadsDir,
            files: relativeFiles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// @route   GET /api/admin/debug-s3
// @desc    Debug S3 connectivity and permission
// @access  Public (Temporary for debugging) - verify it is protected in prod
import { s3 } from '../middleware/uploadS3.js';
import { ListObjectsCommand } from '@aws-sdk/client-s3';

router.get('/debug-s3', async (req, res) => {
    try {
        const bucketName = process.env.AWS_BUCKET_NAME;
        if (!bucketName) {
            return res.status(500).json({ message: 'AWS_BUCKET_NAME is not defined in env' });
        }

        const command = new ListObjectsCommand({
            Bucket: bucketName,
            MaxKeys: 1
        });

        const response = await s3.send(command);

        res.json({
            success: true,
            message: 'Successfully connected to S3',
            bucket: bucketName,
            region: process.env.AWS_REGION,
            data: response
        });
    } catch (error) {
        console.error('S3 Debug Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to connect to S3',
            error: error.message,
            code: error.code,
            requestId: error.$metadata?.requestId
        });
    }
});

export default router;
