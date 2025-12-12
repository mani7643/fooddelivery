import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Driver from './models/Driver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/courier-platform';
    console.log('Connecting to:', uri.startsWith('mongodb+srv') ? 'Remote Atlas DB' : 'Local DB');

    await mongoose.connect(uri);
    console.log('MongoDB Connected');

    // Find specific driver from screenshot
    const email = 'tonybigfan0@gmail.com';
    // We need to find User first to get _id, then Driver
    const User = (await import('./models/User.js')).default;
    const user = await User.findOne({ email });

    if (user) {
        console.log(`Found User: ${user.name} (${user._id})`);
        const driver = await Driver.findOne({ userId: user._id });
        if (driver) {
            console.log('--- TARGET DRIVER ---');
            console.log(`Status: ${driver.verificationStatus}`);
            console.log(`Docs: ${JSON.stringify(driver.documents, null, 2)}`);
        } else {
            console.log('Driver profile not found for this user.');
        }
    } else {
        console.log(`User with email ${email} NOT FOUND.`);
    }

    const count = await Driver.countDocuments();
    console.log(`Total Drivers in DB: ${count}`);
    console.log('-------------------');
    process.exit(0);
} catch (err) {
    console.error(err);
    process.exit(1);
}
};

connectDB();
