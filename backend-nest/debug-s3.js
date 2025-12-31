require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

async function run() {
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    console.log('--- Config Check ---');
    console.log('Bucket:', bucketName || 'MISSING');
    console.log('Region:', region || 'MISSING');
    console.log('Access Key:', accessKeyId ? (accessKeyId.substring(0, 4) + '...') : 'MISSING');
    console.log('Secret Key:', secretAccessKey ? 'PRESENT' : 'MISSING');

    if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
        console.error('ERROR: Missing AWS configuration');
        return;
    }

    const s3Client = new S3Client({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: 'test-upload.txt',
        ContentType: 'text/plain',
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        console.log('SUCCESS: Generated Signed URL');
        console.log(signedUrl.substring(0, 50) + '...');
    } catch (error) {
        console.error('ERROR Generating URL:', error.message);
    }
}

run();
