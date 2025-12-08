import mongoose from 'mongoose';
import PhoneVerification from './models/PhoneVerification.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is undefined. Check .env file.');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const getOtp = async () => {
    await connectDB();

    const phone = '+919999988888';

    try {
        const verification = await PhoneVerification.findOne({ phone });
        if (verification) {
            console.log(`OTP found: ${verification.otp}`);
        } else {
            console.log('No OTP found for', phone);
        }
    } catch (error) {
        console.error('Error getting OTP:', error);
    } finally {
        await mongoose.disconnect();
    }
};

getOtp();
