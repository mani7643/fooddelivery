import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import notificationService from './services/notificationService.js';

dotenv.config();

const testEmail = async () => {
    try {
        console.log('Using Mongo URI:', process.env.MONGO_URI ? 'FOUND' : 'MISSING');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Check for Admins
        const admins = await User.find({ role: 'admin' });
        console.log(`\nFound ${admins.length} Admin(s):`);
        admins.forEach(a => console.log(` - ${a.name} (${a.email})`));

        if (admins.length === 0) {
            console.error('❌ NO ADMINS FOUND!');
            // Create a temp admin to test?
            // No, user likely has an admin.
            process.exit(1);
        }

        // 2. Test Notification Service
        console.log('\nAttempting to send test email to first admin...');
        const targetAdmin = admins[0];

        await notificationService.sendAdminDocumentNotification(
            targetAdmin.email,
            "Test Driver (Debug)",
            "driver@debug.com"
        );

        console.log('\nCheck logs above. If Ethereal is used, a preview URL should appear.');

        setTimeout(() => process.exit(0), 5000);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testEmail();
