<<<<<<< HEAD
import { Injectable, Logger } from '@nestjs/common';
=======
import { Injectable } from '@nestjs/common';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
    private transporter: nodemailer.Transporter;
<<<<<<< HEAD
    private readonly logger = new Logger(NotificationService.name);

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
    }

    private async initializeTransporter() {
        const service = this.configService.get<string>('EMAIL_SERVICE');
        const user = this.configService.get<string>('EMAIL_USER');
        const pass = this.configService.get<string>('EMAIL_PASS');

        if (service && user && pass) {
            this.transporter = nodemailer.createTransport({
                service,
                auth: { user, pass },
            });
        } else {
            try {
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                this.logger.log(`✅ Ethereal Email Initialized: ${testAccount.user}`);
            } catch (err) {
                this.logger.warn('Failed to create Ethereal account, email sending will be simulated.');
            }
        }
    }

    async sendWelcomeEmail(to: string, name: string) {
        const subject = 'Welcome to Our Delivery Network! 🚀';
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome, ${name}!</h2>
            <p>We are thrilled to have you join our delivery partner network.</p>
            <p>Your account has been successfully created. You can now log in to the app and start accepting orders.</p>
        </div>
    `;
        await this.sendEmail(to, subject, html);
    }

    async sendOtpEmail(to: string, otp: string) {
        const subject = 'Verify Your Email - OTP Code';
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Email Verification</h2>
            <p>Your OTP code is:</p>
            <h1>${otp}</h1>
            <p>This code will expire in 5 minutes.</p>
        </div>
    `;
        await this.sendEmail(to, subject, html);
    }

    async sendPasswordResetEmail(to: string, resetUrl: string, name: string) {
        const subject = 'Password Reset Request';
        const html = `
        <p>Hello ${name},</p>
        <p>Click below to reset password:</p>
        <a href="${resetUrl}">Reset Password</a>
    `;
        await this.sendEmail(to, subject, html);
    }

    async sendVerificationApprovalEmail(to: string, driverName: string) {
        const subject = 'Verification Approved';
        const html = `<p>Hello ${driverName}, your documents have been verified!</p>`;
        await this.sendEmail(to, subject, html);
    }

    async sendVerificationRejectionEmail(to: string, driverName: string, reason: string) {
        const subject = 'Verification Rejected';
        const html = `<p>Hello ${driverName}, your documents were rejected. Reason: ${reason}</p>`;
        await this.sendEmail(to, subject, html);
    }

    async sendAdminDocumentNotification(adminEmail: string, driverName: string, driverEmail: string) {
        const subject = `New Documents: ${driverName}`;
        const html = `<p>Driver ${driverName} (${driverEmail}) uploaded documents.</p>`;
        await this.sendEmail(adminEmail, subject, html);
    }

    async sendWelcomeSMS(phone: string, name: string) {
        this.logger.log(`📱 SMS TO ${phone}: Welcome ${name}`);
        return true;
    }

    private async sendEmail(to: string, subject: string, html: string) {
        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: '"Courier Platform" <no-reply@courier.com>',
                    to,
                    subject,
                    html,
                });
                this.logger.log(`✅ Email sent to ${to}`);
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    this.logger.log(`Preview: ${previewUrl}`);
                }
            } catch (error) {
                this.logger.error(`Failed to send email to ${to}`, error.stack);
            }
        } else {
            this.logger.log(`[SIMULATION] Email to ${to}, Subject: ${subject}`);
        }
=======

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
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
    }
}
