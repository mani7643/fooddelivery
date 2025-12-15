import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

// Initialize S3 Client from environment variables
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const bucketName = process.env.AWS_BUCKET_NAME;

if (!bucketName) {
    console.error('❌ AWS_BUCKET_NAME is missing in .env');
    process.exit(1);
}

const corsRules = [
    {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
        AllowedOrigins: ["*"], // Allow input from any domain (Browser/CloudFront)
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3000
    }
];

const run = async () => {
    try {
        console.log(`🔧 Updating CORS for bucket: ${bucketName}...`);

        await s3.send(new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: { CORSRules: corsRules }
        }));

        console.log('✅ Successfully updated S3 CORS policy!');
        console.log('You should now be able to upload files directly from the browser.');
    } catch (err) {
        console.error('❌ Error updating CORS:', err);
        console.error('Check if your .env file has valid AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    }
};

run();
