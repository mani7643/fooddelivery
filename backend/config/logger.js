import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'courier-backend' },
    transports: [
        // Always log to console (useful for Docker logs / local dev)
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Add CloudWatch Transport ONLY in Production
if (process.env.NODE_ENV === 'production') {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        logger.add(new WinstonCloudWatch({
            logGroupName: 'courier-backend-logs',
            logStreamName: `production-${new Date().toISOString().split('T')[0]}`,
            awsRegion: process.env.AWS_REGION || 'us-east-1',
            jsonMessage: true,
            awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
            awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY
        }));
        console.log('✅ CloudWatch Logging Enabled');
    } else {
        console.warn('⚠️ AWS Credentials missing. CloudWatch logging disabled.');
    }
}

export default logger;
