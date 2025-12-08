import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
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

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

export default EmailVerification;
