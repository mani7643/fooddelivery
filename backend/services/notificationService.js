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

    async sendWelcomeSMS(phone, name) {
        // In a real app, integrate with Twilio/SNS here
        const message = `Welcome ${name}! Thanks for joining our delivery network. Download the app to start earning.`;

        console.log('📱 ================= SMS SENT ================= 📱');
        console.log(`To: ${phone}`);
        console.log(`Message: ${message}`);
        console.log('==================================================');

        return Promise.resolve(true);
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
