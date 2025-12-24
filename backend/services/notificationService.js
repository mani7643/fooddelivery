import nodemailer from 'nodemailer';

class NotificationService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    async initializeTransporter() {
        if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Production/Real Email
            this.transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else {
            // Development: Use Ethereal
            try {
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
                console.log('✅ Ethereal Email Initialized');
                console.log(`   User: ${testAccount.user}`);
                console.log(`   Pass: ${testAccount.pass}`);
            } catch (err) {
                console.error('Failed to create Ethereal account:', err.message);
            }
        }
    }

    async sendWelcomeEmail(to, name) {
        const subject = 'Welcome to Our Delivery Network! 🚀';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome, ${name}!</h2>
                <p>We are thrilled to have you join our delivery partner network.</p>
                <p>Your account has been successfully created. You can now log in to the app and start accepting orders.</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>The Team</strong></p>
            </div>
        `;

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: '"Fast Delivery" <no-reply@fastdelivery.com>',
                    to,
                    subject,
                    html
                });

                console.log(`✅ Welcome email sent to ${to}`);

                // If using Ethereal, log the preview URL
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log('📬 ---------------------------------------------------');
                    console.log(`📬 View Real Email Here: ${previewUrl}`);
                    console.log('📬 ---------------------------------------------------');
                }
            } catch (error) {
                console.error('❌ Error sending welcome email:', error.message);
                this.logEmailToConsole(to, subject, html);
            }
        } else {
            // Wait a moment for transporter to init if it's race condition, or fallback
            if (!this.transporter && !process.env.EMAIL_USER) {
                // Try one more time to wait or just log
                this.logEmailToConsole(to, subject, html);
            }
        }
    }

    async sendOtpEmail(to, otp) {
        const subject = 'Verify Your Email - OTP Code';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; text-align: center;">Email Verification</h2>
                <p>Your OTP code for email verification is:</p>
                <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <h1 style="color: #4F46E5; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
                </div>
                <p style="color: #666;">This code will expire in <strong>5 minutes</strong>.</p>
                <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
                <br/>
                <p style="color: #999; font-size: 12px;">This is an automated email, please do not reply.</p>
            </div>
        `;

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: '"Courier Platform" <no-reply@courier.com>',
                    to,
                    subject,
                    html
                });

                console.log(`✅ OTP email sent to ${to}`);

                // If using Ethereal, log the preview URL
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log('📬 ---------------------------------------------------');
                    console.log(`📬 View OTP Email: ${previewUrl}`);
                    console.log('📬 ---------------------------------------------------');
                }
            } catch (error) {
                console.error('❌ Error sending OTP email:', error.message);
                this.logEmailToConsole(to, subject, `OTP: ${otp}`);
            }
        } else {
            this.logEmailToConsole(to, subject, `OTP: ${otp}`);
        }
    }

    async sendPasswordResetEmail(to, resetUrl, name) {
        const subject = 'Password Reset Request';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>
                    <p style="color: #666; font-size: 16px;">Hello${name ? ' ' + name : ''},</p>
                    <p style="color: #666; font-size: 16px;">You requested to reset your password. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
                    <p style="background: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 14px; color: #4F46E5;">
                        ${resetUrl}
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 13px; margin: 5px 0;">⏰ This link will expire in <strong>10 minutes</strong></p>
                        <p style="color: #999; font-size: 13px; margin: 5px 0;">🔒 If you didn't request this, please ignore this email</p>
                        <p style="color: #999; font-size: 13px; margin: 5px 0;">❓ Your password won't change until you create a new one</p>
                    </div>
                </div>
                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: '"Courier Platform" <no-reply@courier.com>',
                    to,
                    subject,
                    html
                });

                console.log(`✅ Password reset email sent to ${to}`);

                // If using Ethereal, log the preview URL
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log('📬 ---------------------------------------------------');
                    console.log(`📬 View Password Reset Email: ${previewUrl}`);
                    console.log('📬 ---------------------------------------------------');
                }
            } catch (error) {
                console.error('❌ Error sending password reset email:', error.message);
                this.logEmailToConsole(to, subject, `Reset URL: ${resetUrl}`);
            }
        } else {
            this.logEmailToConsole(to, subject, `Reset URL: ${resetUrl}`);
        }
    }

    async sendVerificationApprovalEmail(to, driverName) {
        const subject = 'Verification Approved - Start Accepting Orders!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #10b981; text-align: center; margin-bottom: 20px;">🎉 Verification Approved!</h2>
                    <p style="color: #666; font-size: 16px;">Hello ${driverName},</p>
                    <p style="color: #666; font-size: 16px;">Great news! Your documents have been verified and approved.</p>
                    
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                        <p style="color: white; font-size: 18px; font-weight: bold; margin: 0;">You can now start accepting orders!</p>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Next Steps:</h3>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>Log in to your driver dashboard</li>
                            <li>Set your availability to "Available"</li>
                            <li>Start accepting delivery orders</li>
                            <li>Track your earnings in real-time</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Go to Dashboard
                        </a>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 13px; margin: 5px 0;">📱 Download our mobile app for better experience</p>
                        <p style="color: #999; font-size: 13px; margin: 5px 0;">💰 Earn more with our referral program</p>
                        <p style="color: #999; font-size: 13px; margin: 5px 0;">📞 Need help? Contact support@courier.com</p>
                    </div>
                </div>
                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: '"Courier Platform" <no-reply@courier.com>',
                    to,
                    subject,
                    html
                });

                console.log(`✅ Verification approval email sent to ${to}`);

                // If using Ethereal, log the preview URL
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log('📬 ---------------------------------------------------');
                    console.log(`📬 View Approval Email: ${previewUrl}`);
                    console.log('📬 ---------------------------------------------------');
                }
            } catch (error) {
                console.error('❌ Error sending verification approval email:', error.message);
                this.logEmailToConsole(to, subject, `Driver ${driverName} approved`);
            }
        } else {
            this.logEmailToConsole(to, subject, `Driver ${driverName} approved`);
        }
    }

    async sendVerificationRejectionEmail(to, driverName, reason) {
        const subject = 'Verification Update - Action Required';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #ef4444; text-align: center; margin-bottom: 20px;">⚠️ Verification Update</h2>
                    <p style="color: #666; font-size: 16px;">Hello ${driverName},</p>
                    <p style="color: #666; font-size: 16px;">We reviewed your documents, but unfortunately, we could not verify your account at this time.</p>
                    
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 30px 0;">
                        <p style="color: #991b1b; font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">Reason for rejection:</p>
                        <p style="color: #991b1b; font-size: 16px; margin: 0;">${reason || 'Documents were unclear or invalid'}</p>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">What to do next:</h3>
                        <p style="color: #666;">You can log in to your dashboard and re-upload the correct documents based on the feedback above.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Login & Update Documents
                        </a>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 13px; margin: 5px 0;">📞 Need help? Contact support@courier.com</p>
                    </div>
                </div>
                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: '"Courier Platform" <no-reply@courier.com>',
                    to,
                    subject,
                    html
                });

                console.log(`✅ Verification rejection email sent to ${to}`);

                // If using Ethereal, log the preview URL
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log('📬 ---------------------------------------------------');
                    console.log(`📬 View Rejection Email: ${previewUrl}`);
                    console.log('📬 ---------------------------------------------------');
                }
            } catch (error) {
                console.error('❌ Error sending verification rejection email:', error.message);
                this.logEmailToConsole(to, subject, `Driver ${driverName} rejected. Reason: ${reason}`);
            }
        } else {
            this.logEmailToConsole(to, subject, `Driver ${driverName} rejected. Reason: ${reason}`);
        }
    }

    async sendWelcomeSMS(phone, name) {
        // In a real app, integrate with Twilio/SNS here
        const message = `Welcome ${name}! Thanks for joining our delivery network. Download the app to start earning.`;

        console.log('📱 ================= SMS SENT ================= 📱');
        console.log(`To: ${phone}`);
        console.log(`Message: ${message}`);
        console.log('==================================================');

        return Promise.resolve(true);
    }

    async sendAdminDocumentNotification(adminEmail, driverName, driverEmail) {
        const subject = `📢 New Documents Uploaded: ${driverName}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #4F46E5; text-align: center; margin-bottom: 20px;">📄 New Documents to Verify</h2>
                    <p style="color: #666; font-size: 16px;">Hello Admin,</p>
                    <p style="color: #666; font-size: 16px;">Driver <strong>${driverName}</strong> (${driverEmail}) has uploaded their verification documents.</p>
                    
                    <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 30px 0;">
                        <p style="color: #3730a3; font-size: 16px; margin: 0; font-weight: bold;">Action Required:</p>
                        <p style="color: #3730a3; font-size: 14px; margin: 5px 0 0 0;">Please review the documents in the admin dashboard.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                            Go to Admin Dashboard
                        </a>
                    </div>
                </div>
                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                    This is an automated notification.
                </p>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: '"Courier Platform" <no-reply@courier.com>',
                    to: adminEmail,
                    subject,
                    html
                });
                console.log(`✅ Admin notification sent to ${adminEmail}`);
            } catch (error) {
                console.error(`❌ Error notifying admin ${adminEmail}:`, error.message);
            }
        } else {
            this.logEmailToConsole(adminEmail, subject, `Driver ${driverName} uploaded documents`);
        }
    }

    logEmailToConsole(to, subject, body) {
        console.log('📧 ================= EMAIL SENT ================= 📧');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('Content (preview):', body.substring(0, 100) + '...');
        console.log('====================================================');
    }
}

export default new NotificationService();
