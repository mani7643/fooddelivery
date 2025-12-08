import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import PhoneVerification from '../models/PhoneVerification.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Check if phone already registered
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (upsert)
        await PhoneVerification.findOneAndUpdate(
            { phone },
            { phone, otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        // Simulate sending SMS
        console.log('====================================================');
        console.log(`OTP FOR ${phone}: ${otp}`);
        console.log('====================================================');

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Server error sending OTP', error: error.message });
    }
});

// @route   POST /api/auth/register
// @desc    Register new delivery partner (driver)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone, vehicleType, vehicleNumber, licenseNumber, otp } = req.body;

        // Verify OTP
        if (!otp) {
            return res.status(400).json({ message: 'OTP is required' });
        }

        const verification = await PhoneVerification.findOne({ phone, otp });
        if (!verification) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Validate required driver fields
        if (!vehicleNumber || !licenseNumber) {
            return res.status(400).json({
                message: 'Vehicle number and license number are required'
            });
        }

        console.log('Using OTP verification:', verification._id);
        // Delete used OTP
        await PhoneVerification.deleteOne({ _id: verification._id });

        console.log('Creating User...');
        // Create user with driver role
        const user = await User.create({
            email,
            password,
            name,
            phone,
            role: 'driver' // Always driver
        });

        console.log('Creating driver profile for:', user.email);

        // Create driver profile
        const driver = await Driver.create({
            userId: user._id,
            name: name,
            phone: phone,
            vehicleType: vehicleType || 'bike',
            vehicleNumber: vehicleNumber,
            licenseNumber: licenseNumber
        });

        console.log('✅ Driver profile created successfully:', driver._id);
        console.log('✅ Registration completed for:', user.email);

        // Send welcome notifications (async, don't await/block response)
        notificationService.sendWelcomeEmail(user.email, user.name);
        notificationService.sendWelcomeSMS(user.phone, user.name);

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('Error stack:', error.stack);
        // Clean up user if created but driver failed
        // Note: In production use transactions
        const { email } = req.body;
        if (email) {
            const user = await User.findOne({ email });
            if (user && !await Driver.findOne({ userId: user._id })) {
                await User.deleteOne({ _id: user._id });
                console.log('Rollback: Deleted orphaned user', user._id);
            }
        }

        res.status(500).json({
            message: 'Server error during registration',
            error: error.message,
            stack: error.stack
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                profilePhoto: user.profilePhoto
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/forgotpassword
// @desc    Forgot password
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${req.protocol}://localhost:5173/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        // In a real app, send this via email. For dev, log it.
        console.log('====================================================');
        console.log('PASSWORD RESET LINK (DEV ONLY):');
        console.log(resetUrl);
        console.log('====================================================');

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(500).json({ message: 'Email could not be sent', error: error.message });
    }
});

// @route   PUT /api/auth/resetpassword/:resettoken
// @desc    Reset password
// @access  Public
router.put('/resetpassword/:resettoken', async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
