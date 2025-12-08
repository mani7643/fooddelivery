import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Document automatically deleted after 5 minutes (300 seconds)
    }
});

const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);

export default PhoneVerification;
