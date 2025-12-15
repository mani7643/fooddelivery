import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import Driver from '../models/Driver.js';
import { s3 as s3Client } from '../middleware/uploadS3.js';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Debug: File-based logging
const DEBUG_LOG_FILE = path.join(process.cwd(), 'debug_driver.log');

const logDebug = (step, data = null) => {
    try {
        const timestamp = new Date().toISOString();
        const safeData = data ? JSON.stringify(data, (key, value) => {
            if (key === 'socket') return '[Socket]'; // Avoid circular deps
            return value;
        }) : '';

        const logLine = `[${timestamp}] [UPLOAD DEBUG] ${step} ${safeData}\n`;

        // Console log for stdout
        console.log(logLine.trim());

        // File log for persistence
        fs.appendFileSync(DEBUG_LOG_FILE, logLine);
    } catch (e) {
        console.error('Logging failed:', e);
    }
};

// @route   GET /api/driver-debug/ping
// @desc    Simple reachability check
// @access  Public
router.get('/ping', (req, res) => {
    res.send('pong');
});

// @route   GET /api/driver-debug/logs
// @desc    View upload debug logs from file
// @access  Public
router.get('/logs', (req, res) => {
    try {
        if (fs.existsSync(DEBUG_LOG_FILE)) {
            const logs = fs.readFileSync(DEBUG_LOG_FILE, 'utf8');
            res.header('Content-Type', 'text/plain');
            res.send(logs);
        } else {
            res.send('No logs found yet.');
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// @route   POST /api/driver-debug/upload
// @desc    Debug version of upload documents
// @access  Private (Driver only)
router.post('/upload', protect, authorize('driver'), async (req, res) => {
    const requestId = Date.now().toString();
    logDebug(`[${requestId}] Starting Upload Request`, { user: req.user._id, bodyKeys: Object.keys(req.body) });

    try {
        const files = req.body;

        if (!files || Object.keys(files).length === 0) {
            logDebug(`[${requestId}] No files provided`);
            return res.status(400).json({ message: 'No files provided' });
        }

        // Initialize S3 Upload
        logDebug(`[${requestId}] Initializing S3 Upload...`);

        const documentUrls = {};
        const uploadPromises = [];

        for (const [key, base64String] of Object.entries(files)) {
            if (!base64String) continue;

            const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                logDebug(`[${requestId}] Invalid base64 for ${key}`);
                continue;
            }

            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const fileExtension = contentType.split('/')[1] || 'bin';
            const fileName = `${req.user._id}/documents/${key}-${Date.now()}.${fileExtension}`;

            logDebug(`[${requestId}] Preparing upload for ${key}`, { fileName, contentType });

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
                    logDebug(`[${requestId}] Upload Success: ${key}`, { location: result.Location });
                    documentUrls[key] = result.Location;
                }).catch(err => {
                    logDebug(`[${requestId}] Upload Failed: ${key}`, { error: err.message });
                    throw err;
                })
            );
        }

        await Promise.all(uploadPromises);
        logDebug(`[${requestId}] All S3 uploads complete`);

        // Update Driver
        const driver = await Driver.findOne({ userId: req.user._id });
        if (!driver) {
            logDebug(`[${requestId}] Driver not found`, { userId: req.user._id });
            return res.status(404).json({ message: 'Driver profile not found' });
        }

        logDebug(`[${requestId}] Updating DB for driver ${driver._id}`);

        // Use findByIdAndUpdate to avoid triggering validation on other fields
        const updateResult = await Driver.findByIdAndUpdate(driver._id, {
            $set: {
                documents: { ...driver.documents, ...documentUrls },
                verificationStatus: 'pending_verification'
            }
        }, { new: true }); // Return updated doc

        logDebug(`[${requestId}] DB Update Complete`, { newStatus: updateResult?.verificationStatus, docs: updateResult?.documents });

        res.json({
            success: true,
            message: 'Documents uploaded successfully (Base64)',
            documents: documentUrls
        });

    } catch (error) {
        logDebug(`[${requestId}] FATAL ERROR`, { message: error.message, stack: error.stack });
        console.error('Base64 Upload Error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

export default router;
