import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Driver from '../models/Driver.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
// import { uploadDocuments } from '../middleware/upload.js'; // Removed in favor of S3

const router = express.Router();

// @route   GET /api/driver/profile
// @desc    Get driver profile
// @access  Private (Driver only)
router.get('/profile', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id }).populate('userId', '-password');

        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        res.json({ success: true, driver });
    } catch (error) {
        console.error('Get driver profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/driver/profile
// @desc    Update driver profile
// @access  Private (Driver only)
router.put('/profile', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOneAndUpdate(
            { userId: req.user._id },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        res.json({ success: true, driver });
    } catch (error) {
        console.error('Update driver profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/driver/location
// @desc    Update driver location
// @access  Private (Driver only)
router.put('/location', protect, authorize('driver'), async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        const driver = await Driver.findOneAndUpdate(
            { userId: req.user._id },
            {
                currentLocation: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            },
            { new: true }
        );

        res.json({ success: true, location: driver.currentLocation });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/driver/availability
// @desc    Toggle driver availability
// @access  Private (Driver only)
router.put('/availability', protect, authorize('driver'), async (req, res) => {
    try {
        const { isAvailable } = req.body;

        const driver = await Driver.findOneAndUpdate(
            { userId: req.user._id },
            { isAvailable },
            { new: true }
        );

        res.json({ success: true, isAvailable: driver.isAvailable });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/driver/orders
// @desc    Get driver's orders
// @access  Private (Driver only)
router.get('/orders', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });

        const orders = await Order.find({
            driverId: driver._id
        })
            .populate('restaurantId', 'businessName address')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get driver orders error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/driver/orders/active
// @desc    Get driver's active orders
// @access  Private (Driver only)
router.get('/orders/active', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });

        const orders = await Order.find({
            driverId: driver._id,
            status: { $in: ['ready', 'picked'] }
        })
            .populate('restaurantId', 'businessName address')
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Get active orders error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/driver/orders/:orderId/accept
// @desc    Accept an order
// @access  Private (Driver only)
router.put('/orders/:orderId/accept', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });

        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            {
                driverId: driver._id,
                status: 'picked',
                pickedAt: new Date()
            },
            { new: true }
        );

        res.json({ success: true, order });
    } catch (error) {
        console.error('Accept order error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/driver/orders/:orderId/status
// @desc    Update order status
// @access  Private (Driver only)
router.put('/orders/:orderId/status', protect, authorize('driver'), async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };

        if (status === 'delivered') {
            updateData.deliveredAt = new Date();
            updateData.paymentStatus = 'completed';

            // Update driver earnings
            const order = await Order.findById(req.params.orderId);
            const driver = await Driver.findOne({ userId: req.user._id });

            driver.totalDeliveries += 1;
            driver.totalEarnings += order.deliveryFee;
            driver.todayEarnings += order.deliveryFee;
            await driver.save();
        }

        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            updateData,
            { new: true }
        );

        res.json({ success: true, order });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/driver/earnings
// @desc    Get driver earnings
// @access  Private (Driver only)
router.get('/earnings', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });

        // Get earnings history
        const orders = await Order.find({
            driverId: driver._id,
            status: 'delivered'
        }).sort({ deliveredAt: -1 });

        const earnings = {
            total: driver.totalEarnings,
            today: driver.todayEarnings,
            totalDeliveries: driver.totalDeliveries,
            history: orders.map(order => ({
                orderId: order.orderId,
                amount: order.deliveryFee,
                date: order.deliveredAt
            }))
        };

        res.json({ success: true, earnings });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/driver/upload-documents
// @desc    Upload driver verification documents
// @access  Private (Driver only)
import { uploadDocumentsS3 } from '../middleware/uploadS3.js';

// ... (imports)

// Debug: Global variable to track upload attempts
export let lastUploadAttempt = null;

// @route   POST /api/driver/upload-documents
// @desc    Upload driver verification documents
// @access  Private (Driver only)
router.post('/upload-documents', protect, authorize('driver'), (req, res, next) => {
    // Log intent before multer
    lastUploadAttempt = {
        time: new Date().toISOString(),
        user: req.user._id,
        headers: req.headers['content-type'],
        step: 'Reached Route Handler (Pre-Multer)'
    };
    console.log('Upload Request Received:', lastUploadAttempt);
    next();
}, uploadDocumentsS3, async (req, res) => {
    lastUploadAttempt.step = 'Passed Multer (Success)';
    try {
        // Find driver profile
        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        // Build document URLs from uploaded files (S3 URLs)
        const documentUrls = {};

        if (req.files.aadhaarFront) {
            documentUrls.aadhaarFront = req.files.aadhaarFront[0].location;
            console.log('Aadhaar Front URL:', documentUrls.aadhaarFront);
        }
        if (req.files.aadhaarBack) {
            documentUrls.aadhaarBack = req.files.aadhaarBack[0].location;
        }
        if (req.files.dlFront) {
            documentUrls.dlFront = req.files.dlFront[0].location;
        }
        if (req.files.dlBack) {
            documentUrls.dlBack = req.files.dlBack[0].location;
        }
        if (req.files.panCard) {
            documentUrls.panCard = req.files.panCard[0].location;
        }

        // Update driver documents
        driver.documents = {
            ...driver.documents,
            ...documentUrls
        };

        // Update verification status to pending_verification
        driver.verificationStatus = 'pending_verification';

        await driver.save();

        console.log(`✅ Documents uploaded for driver: ${driver.name}`);

        res.status(200).json({
            success: true,
            message: 'Documents uploaded successfully',
            documents: driver.documents,
            verificationStatus: driver.verificationStatus
        });
    } catch (error) {
        console.error('Upload documents error:', error);
        res.status(500).json({
            message: 'Failed to upload documents',
            error: error.message
        });
    }
});

// @route   GET /api/driver/documents
// @desc    Get driver documents and verification status
// @access  Private (Driver only)
router.get('/documents', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        res.status(200).json({
            success: true,
            documents: driver.documents,
            verificationStatus: driver.verificationStatus,
            verificationNotes: driver.verificationNotes,
            verifiedAt: driver.verifiedAt
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            message: 'Failed to get documents',
            error: error.message
        });
    }
});

export default router;
