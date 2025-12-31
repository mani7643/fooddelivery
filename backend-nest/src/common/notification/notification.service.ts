import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.createTransporter();
    }

    private async createTransporter() {
        // If dev, use Ethereal or just console
        if (this.configService.get('NODE_ENV') !== 'production' && !this.configService.get('EMAIL_SERVICE')) {
            // Use placeholder or Ethereal
        }

        // For now assuming SMTP or Gmail service from env
        this.transporter = nodemailer.createTransport({
            service: this.configService.get('EMAIL_SERVICE'),
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASS'),
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        if (!this.transporter) {
            console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
            return;
        }
        try {
            await this.transporter.sendMail({
                from: this.configService.get('EMAIL_USER'),
                to,
                subject,
                html
            });
            console.log(`Email sent to ${to}`);
        } catch (error) {
            console.error('Email send failed:', error.message);
            // Non-blocking error
        }
    }

    // Helper methods
    async sendWelcomeEmail(email: string, name: string) {
        const subject = 'Welcome to Courier App';
        const html = `<h1>Welcome ${name}</h1><p>Thanks for joining!</p>`;
        await this.sendEmail(email, subject, html);
    }

    async sendOTP(email: string, otp: string) {
        const subject = 'Your OTP Code';
        const html = `<p>Your OTP is: <b>${otp}</b></p>`;
        await this.sendEmail(email, subject, html);
    }

    async sendPasswordResetEmail(email: string, resetUrl: string) {
        const subject = 'Password Reset Request';
        const html = `<p>Click here to reset password: <a href="${resetUrl}">${resetUrl}</a></p>`;
        await this.sendEmail(email, subject, html);
    }

    async sendVerificationApprovalEmail(email: string, name: string) {
        const subject = 'Driver Verification Approved';
        const html = `<p>Hello ${name}, your driver account has been approved!</p>`;
        await this.sendEmail(email, subject, html);
    }

    async sendVerificationRejectionEmail(email: string, name: string, reason: string) {
        const subject = 'Driver Verification Update';
        const html = `<p>Hello ${name}, unfortunately your verification was rejected. Reason: ${reason}</p>`;
        await this.sendEmail(email, subject, html);
    }
}
