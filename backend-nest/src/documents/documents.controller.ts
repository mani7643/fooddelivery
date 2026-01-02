import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post('upload-url')
    async generateUploadUrl(@Request() req, @Body() body: { fileName: string; contentType: string; docType?: string }) {
        return this.documentsService.generateUploadUrl(req.user, body.fileName, body.contentType, body.docType);
    }

    @Post('sign-url')
    async generateSignedUrl(@Body() body: { fileUrl: string }) {
        return this.documentsService.generateSignedUrl(body.fileUrl);
    }
}
