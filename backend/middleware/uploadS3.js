import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// Configure S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION
    // Credentials will be automatically loaded from IAM Role
});

// File filter - same as before
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images (JPEG, PNG) and PDF files are allowed!'), false);
    }
};

// Configure Multer S3 Storage
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: function (req, file, cb) {
            cb(null, process.env.AWS_BUCKET_NAME);
        },
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // Path: driver-documents/{userId}/{filename}
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const filename = `driver-documents/${req.user.id}/${file.fieldname}-${uniqueSuffix}${ext}`;
            cb(null, filename);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Middleware for uploading driver documents
export const uploadDocumentsS3 = upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'dlFront', maxCount: 1 },
    { name: 'dlBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 }
]);

export { s3 };
export default upload;
