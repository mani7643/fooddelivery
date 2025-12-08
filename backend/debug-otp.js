import mongoose from 'mongoose';
import PhoneVerification from './models/PhoneVerification.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

const setupOtp = async () => {
    await connectDB();

    const phone = '+919999988888';
    const otp = '123456';

    try {
        await PhoneVerification.deleteOne({ phone });
        await PhoneVerification.create({
            phone,
            otp
        });
        console.log(`Created OTP ${otp} for ${phone}`);
    } catch (error) {
        console.error('Error creating OTP:', error);
    } finally {
        await mongoose.disconnect();
    }
};

setupOtp();
