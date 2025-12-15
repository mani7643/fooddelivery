import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const testEmail = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Check for Admins
        const admins = await User.find({ role: 'admin' });
        console.log(`\nFound ${admins.length} Admin(s):`);
        admins.forEach(a => console.log(` - ${a.name} (${a.email})`));

        if (admins.length === 0) {
            console.error('❌ NO ADMINS FOUND! Notification cannot be sent.');
            process.exit(1);
        }

        // 2. Test Notification Service
        console.log('\nAttempting to send test email to first admin...');
        const targetAdmin = admins[0];

        // Mock driver data
        const mockDriverName = "Test Driver";
        const mockDriverEmail = "test.driver@example.com";

        await notificationService.sendAdminDocumentNotification(
            targetAdmin.email,
            mockDriverName,
            mockDriverEmail
        );

        console.log('\n✅ Test execution finished. Check console logs above for "EMAIL SENT" or "Error".');

        // Wait a bit for async mailer
        setTimeout(() => {
            console.log('Done.');
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testEmail();
