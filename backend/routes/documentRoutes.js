import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { CreateBucketCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../middleware/uploadS3.js';

const router = express.Router();

// @route   POST /api/documents/upload-url
// @desc    Generate a presigned URL for uploading a private S3 object
// @access  Private (Admin or Driver)
router.post('/upload-url', protect, async (req, res) => {
    try {
        const { fileName, contentType, docType } = req.body;

        if (!fileName || !contentType) {
            return res.status(400).json({ message: 'File name and content type are required' });
        }

        const bucketName = process.env.AWS_BUCKET_NAME;

        // Sanitize user name (lowercase, underscores replaced by hyphens)
        const sanitizedUserName = req.user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Get extension
        const ext = fileName.split('.').pop();

        // Construct key: mani-achanta-documents/mani-achanta-aadhaarFront.png
        // Using docType if available, otherwise fallback to timestamp+filename
        const finalFileName = docType
            ? `${sanitizedUserName}-${docType}.${ext}`
            : `${sanitizedUserName}-${Date.now()}-${fileName}`;

        const key = `${sanitizedUserName}-documents/${finalFileName}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType
        });

        // Generate signed URL valid for 5 minutes
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        res.json({
            success: true,
            signedUrl,
            key, // Frontend needs this key to send back to the server after upload
            fileUrl: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}` // Optional full URL hint
        });

    } catch (error) {
        console.error('Error generating upload URL:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/documents/sign-url
// @desc    Generate a presigned URL for accessing a private S3 object
// @access  Private (Admin or Driver)
router.post('/sign-url', protect, async (req, res) => {
    try {
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ message: 'No file URL provided' });
        }

        // Check if it's already a non-S3 URL (local file)
        if (!fileUrl.startsWith('http')) {
            // It's a local file path, just return the full local URL
            const fullUrl = `${process.env.FRONTEND_URL || 'http://localhost:8000'}${fileUrl}`;
            return res.json({ signedUrl: fullUrl });
        }

        // Logic to extract Key from S3 URL
        // Example S3 URL: https://bucket-name.s3.region.amazonaws.com/driver-documents/user123/image.jpg
        // We need: driver-documents/user123/image.jpg

        // Simple extraction strategy: split by amazonaws.com/ and get the second part
        // This is robust enough for standard S3 URLs
        let key = '';
        if (fileUrl.includes('amazonaws.com/')) {
            key = fileUrl.split('amazonaws.com/')[1];
        } else {
            // Fallback or custom domain: assume the whole thing IS the key if it doesn't look like a URL
            // But usually fileUrl from DB is the full Location.
            // Let's try to extract key by assuming standard structure
            try {
                const urlObj = new URL(fileUrl);
                // pathname will be /driver-documents/...
                // remove leading slash
                key = urlObj.pathname.substring(1);
            } catch (e) {
                // Not a valid URL, maybe it is just the key?
                key = fileUrl;
            }
        }

        // Safety check to avoid signing arbitrary URLs
        if (!key) {
            return res.status(400).json({ message: 'Invalid file URL' });
        }

        const bucketName = process.env.AWS_BUCKET_NAME;

        // Guess mime type from extension
        const ext = key.split('.').pop().toLowerCase();
        let contentType = 'application/octet-stream';
        if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'pdf') contentType = 'application/pdf';

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
            ResponseContentDisposition: 'inline',
            ResponseContentType: contentType
        });

        // Generate signed URL valid for 15 minutes (900 seconds)
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

        res.json({ success: true, signedUrl });

    } catch (error) {
        console.error('Error signing URL:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
