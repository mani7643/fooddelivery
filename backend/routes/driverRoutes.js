import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Driver from '../models/Driver.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { uploadDocumentsS3 } from '../middleware/uploadS3.js';
import { s3 as s3Client } from '../middleware/uploadS3.js';
import { Upload } from '@aws-sdk/lib-storage';

const router = express.Router();

// Debug: Global variable to track upload attempts
export let lastUploadAttempt = null;

// @route   GET /api/driver/profile
router.get('/profile', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id }).populate('userId', '-password');
        if (!driver) return res.status(404).json({ message: 'Driver profile not found' });
        res.json({ success: true, driver });
    } catch (error) {
        console.error('Get driver profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/driver/profile
router.put('/profile', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOneAndUpdate(
            { userId: req.user._id },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!driver) return res.status(404).json({ message: 'Driver profile not found' });
        res.json({ success: true, driver });
    } catch (error) {
        console.error('Update driver profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/driver/location
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
router.get('/orders', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });
        const orders = await Order.find({ driverId: driver._id })
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
router.put('/orders/:orderId/status', protect, authorize('driver'), async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };

        if (status === 'delivered') {
            updateData.deliveredAt = new Date();
            updateData.paymentStatus = 'completed';
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
router.get('/earnings', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });
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
router.post('/upload-documents', protect, authorize('driver'), (req, res, next) => {
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
        if (!req.files || Object.keys(req.files).length === 0) {
            throw new Error('No files received (Multer parsed nothing). Check Content-Type header.');
        }

        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

        const documentUrls = {};
        if (req.files.aadhaarFront) documentUrls.aadhaarFront = req.files.aadhaarFront[0].location;
        if (req.files.aadhaarBack) documentUrls.aadhaarBack = req.files.aadhaarBack[0].location;
        if (req.files.dlFront) documentUrls.dlFront = req.files.dlFront[0].location;
        if (req.files.dlBack) documentUrls.dlBack = req.files.dlBack[0].location;
        if (req.files.panCard) documentUrls.panCard = req.files.panCard[0].location;

        await Driver.findByIdAndUpdate(driver._id, {
            $set: {
                documents: { ...driver.documents, ...documentUrls },
                verificationStatus: 'pending_verification'
            }
        });

        console.log(`✅ Documents uploaded for driver: ${driver.name}`);
        res.status(200).json({
            success: true,
            message: 'Documents uploaded successfully',
            documents: driver.documents,
            verificationStatus: driver.verificationStatus
        });
    } catch (error) {
        console.error('Upload documents error:', error);
        res.status(500).json({ message: 'Failed to upload documents', error: error.message });
    }
});

// @route   POST /api/driver/upload-documents-base64
router.post('/upload-documents-base64', protect, authorize('driver'), async (req, res) => {
    try {
        const files = req.body;
        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }

        console.log('Initializing S3 Upload...');
        const documentUrls = {};
        const uploadPromises = [];

        for (const [key, base64String] of Object.entries(files)) {
            if (!base64String) continue;

            const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                console.error(`Invalid base64 string for ${key}`);
                continue;
            }

            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileExtension = contentType.split('/')[1] || 'bin';
            const fileName = `${req.user._id}/documents/${key}-${Date.now()}.${fileExtension}`;

            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: fileName,
                    Body: buffer,
                    ContentType: contentType
                }
            });

            uploadPromises.push(
                upload.done().then(result => {
                    documentUrls[key] = result.Location;
                })
            );
        }

        await Promise.all(uploadPromises);

        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

        await Driver.findByIdAndUpdate(driver._id, {
            $set: {
                documents: { ...driver.documents, ...documentUrls },
                verificationStatus: 'pending_verification'
            }
        });

        console.log(`✅ Base64 Documents uploaded for driver: ${driver.name}`);
        res.json({
            success: true,
            message: 'Documents uploaded successfully (Base64)',
            documents: documentUrls
        });

    } catch (error) {
        console.error('Base64 Upload Error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// @route   GET /api/driver/documents
router.get('/documents', protect, authorize('driver'), async (req, res) => {
    try {
        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

        res.status(200).json({
            success: true,
            documents: driver.documents,
            verificationStatus: driver.verificationStatus,
            verificationNotes: driver.verificationNotes,
            verifiedAt: driver.verifiedAt
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ message: 'Failed to get documents', error: error.message });
    }
});

export default router;
