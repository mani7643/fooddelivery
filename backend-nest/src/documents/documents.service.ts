import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class DocumentsService {
    private s3Client: S3Client;
    private bucketName: string;
    private readonly logger = new Logger(DocumentsService.name);

    constructor(private configService: ConfigService) {
        this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
        const region = this.configService.get<string>('AWS_REGION');
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

        this.s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async generateUploadUrl(user: any, fileName: string, contentType: string, docType?: string) {
        if (!fileName || !contentType) {
            throw new BadRequestException('File name and content type are required');
        }

        const sanitizedUserName = user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const ext = fileName.split('.').pop();

        const finalFileName = docType
            ? `${sanitizedUserName}-${docType}.${ext}`
            : `${sanitizedUserName}-${Date.now()}-${fileName}`;

        const key = `${user._id}-documents/${finalFileName}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });

        try {
            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
            return {
                success: true,
                signedUrl,
                key, // Frontend needs this key to send back to the server after upload
                fileUrl: `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`
            };
        } catch (error) {
            this.logger.error('Error generating upload URL', error);
            throw error;
        }
    }

    async generateSignedUrl(fileUrl: string) {
        if (!fileUrl) {
            throw new BadRequestException('No file URL provided');
        }

        // Check if it's likely a local file path
        if (fileUrl.startsWith('/')) {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:8000';
            return { signedUrl: `${frontendUrl}${fileUrl}` };
        }

        let key = '';
        if (fileUrl.includes('amazonaws.com/')) {
            key = fileUrl.split('amazonaws.com/')[1];
        } else {
            try {
                const urlObj = new URL(fileUrl);
                key = urlObj.pathname.substring(1);
            } catch (e) {
                key = fileUrl;
            }
        }

        if (!key) {
            throw new BadRequestException('Invalid file URL');
        }

        // Guess mime type from extension
        const ext = key.split('.').pop().toLowerCase();
        let contentType = 'application/octet-stream';
        if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'pdf') contentType = 'application/pdf';

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ResponseContentDisposition: 'inline',
            ResponseContentType: contentType,
        });

        try {
            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
            return { success: true, signedUrl };
        } catch (error) {
            this.logger.error('Error signing URL', error);
            throw error;
        }
    }
}
