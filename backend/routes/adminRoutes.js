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
            verificationStatus: { $in: ['pending_verification', 'pending_documents'] }
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

        if (!['verified', 'rejected', 'pending_verification'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be "verified", "rejected" or "pending_verification"' });
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

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDrivers = await Driver.countDocuments();
        const pendingVerification = await Driver.countDocuments({ verificationStatus: 'pending_verification' });
        const verifiedDrivers = await Driver.countDocuments({ verificationStatus: 'verified' });
        const rejectedDrivers = await Driver.countDocuments({ verificationStatus: 'rejected' });

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalDrivers,
                pendingVerification,
                verifiedDrivers,
                rejectedDrivers
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/drivers
// @desc    Get all drivers with filters (status, search)
// @access  Private (Admin only)
router.get('/drivers', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};

        // Status Filter
        if (status) {
            filter.verificationStatus = status;
        }

        // Search Filter
        if (search) {
            // Find users matching name, email, or phone
            const userQuery = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            };
            const matchingUsers = await User.find(userQuery).select('_id');
            const matchingUserIds = matchingUsers.map(user => user._id);

            // Add userId filter to driver query
            filter.userId = { $in: matchingUserIds };
        }

        const drivers = await Driver.find(filter)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, drivers });
    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/online-drivers
// @desc    Get all online drivers (available & verified)
// @access  Private (Admin only)
router.get('/online-drivers', protect, authorize('admin'), async (req, res) => {
    try {
        const drivers = await Driver.find({
            verificationStatus: 'verified',
            isAvailable: true
        })
            .select('userId name phone vehicleType vehicleNumber currentLocation currentStatus')
            .populate('userId', 'name email phone');

        res.json({ success: true, drivers });
    } catch (error) {
        console.error('Get online drivers error:', error);
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

        const listResponse = await s3.send(command);

        // Test Write Permission
        const { PutObjectCommand } = await import('@aws-sdk/client-s3');
        const uploadCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: 'debug-write-test.txt',
            Body: 'S3 Write Permission Test - Success',
            ContentType: 'text/plain'
        });

        await s3.send(uploadCommand);

        res.json({
            success: true,
            message: 'Successfully connected and WROTE to S3',
            bucket: bucketName,
            region: process.env.AWS_REGION,
            data: listResponse,
            writeTest: 'Success'
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


// Delete driver and associated user
router.delete('/driver/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Delete associated user account
        if (driver.userId) {
            await User.findByIdAndDelete(driver.userId);
        }

        // Delete driver profile
        await Driver.findByIdAndDelete(req.params.id);

        res.json({ message: 'Driver and associated user account deleted successfully' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({ message: 'Error deleting driver' });
    }
});

// @route   GET /api/admin/debug-db
// @desc    Debug Database Driver Status
// @access  Public (Temporary for debugging) - verify it is protected in prod
router.get('/debug-db', async (req, res) => {
    try {
        const email = 'tonybigfan0@gmail.com';
        const User = (await import('../models/User.js')).default;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ message: 'User not found in DB', email });
        }

        const driver = await Driver.findOne({ userId: user._id });

        // Import the debug variable from driverRoutes
        const { lastUploadAttempt } = await import('../routes/driverRoutes.js');
        // Import global log from server.js
        const { lastGlobalRequest, lastPostRequest } = await import('../server.js');

        res.json({
            success: true,
            message: 'Driver found',
            globalLog: lastGlobalRequest || 'No global requests logged',
            postLog: lastPostRequest || 'No POST requests logged',
            lastUploadLog: lastUploadAttempt || 'No upload requests logged since server restart',
            user: { _id: user._id, name: user.name, email: user.email },
            driver: driver ? {
                _id: driver._id,
                verificationStatus: driver.verificationStatus,
                documents: driver.documents
            } : 'No Driver Profile'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
