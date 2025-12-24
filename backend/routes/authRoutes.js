import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import PhoneVerification from '../models/PhoneVerification.js';
import EmailVerification from '../models/EmailVerification.js';
import notificationService from '../services/notificationService.js';
import logger from '../config/logger.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @route   POST /api/auth/send-email-otp
// @desc    Send OTP to email for verification
// @access  Public
router.post('/send-email-otp', async (req, res) => {
    try {
        logger.info('📧 [EMAIL-OTP] Received send-email-otp request');
        const { email } = req.body;

        if (!email) {
            logger.info('❌ [EMAIL-OTP] No email provided');
            return res.status(400).json({ message: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger.info('❌ [EMAIL-OTP] Invalid email format');
            return res.status(400).json({ message: 'Invalid email format' });
        }

        logger.info(`📧 [EMAIL-OTP] Processing for email: ${email}`);

        // Check if email already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.info(`⚠️ [EMAIL-OTP] Email ${email} already registered`);
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        logger.info(`🔢 [EMAIL-OTP] Generated OTP for ${email}: ${otp}`);

        // Save OTP to DB (upsert)
        logger.info(`💾 [EMAIL-OTP] Saving to database...`);
        const verification = await EmailVerification.findOneAndUpdate(
            { email },
            { email, otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );
        logger.info(`✅ [EMAIL-OTP] Saved to database with ID: ${verification._id}`);

        // Send OTP via email
        await notificationService.sendOtpEmail(email, otp);
        logger.info('====================================================');
        logger.info(`📧 OTP FOR ${email}: ${otp}`);
        logger.info(`⏰ Valid for 5 minutes`);
        logger.info('====================================================');

        res.json({ success: true, message: 'OTP sent to your email' });
        logger.info(`✅ [EMAIL-OTP] Response sent successfully for ${email}`);
    } catch (error) {
        logger.error('❌ [EMAIL-OTP] Send OTP error:', error);
        logger.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ message: 'Server error sending OTP', error: error.message });
    }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
// DISABLED: OTP verification removed from registration flow
/*
router.post('/send-otp', async (req, res) => {
    try {
        logger.info('📞 [OTP] Received send-otp request');
        const { phone } = req.body;

        if (!phone) {
            logger.info('❌ [OTP] No phone number provided');
            return res.status(400).json({ message: 'Phone number is required' });
        }

        logger.info(`📞 [OTP] Processing for phone: ${phone}`);

        // Check if phone already registered
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            logger.info(`⚠️ [OTP] Phone ${phone} already registered`);
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        logger.info(`🔢 [OTP] Generated OTP for ${phone}: ${otp}`);

        // Save OTP to DB (upsert)
        logger.info(`💾 [OTP] Saving to database...`);
        const verification = await PhoneVerification.findOneAndUpdate(
            { phone },
            { phone, otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );
        logger.info(`✅ [OTP] Saved to database with ID: ${verification._id}`);

        // Simulate sending SMS
        logger.info('====================================================');
        logger.info(`📱 OTP FOR ${phone}: ${otp}`);
        logger.info(`⏰ Valid for 5 minutes`);
        logger.info('====================================================');

        res.json({ success: true, message: 'OTP sent successfully' });
        logger.info(`✅ [OTP] Response sent successfully for ${phone}`);
    } catch (error) {
        logger.error('❌ [OTP] Send OTP error:', error);
        logger.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ message: 'Server error sending OTP', error: error.message });
    }
});
*/


// @route   POST /api/auth/register
// @desc    Register new delivery partner (driver)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone, vehicleType, vehicleNumber, licenseNumber, otp, role } = req.body;

        // Verify Email OTP
        if (!otp) {
            return res.status(400).json({ message: 'OTP is required' });
        }

        const verification = await EmailVerification.findOne({ email, otp });
        if (!verification) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const userRole = role === 'admin' ? 'admin' : 'driver';
        let accountStatus = 'active';

        // Admin Approval Logic
        if (userRole === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            // First admin is active, subsequent are pending
            accountStatus = adminCount === 0 ? 'active' : 'pending';
        }

        // Validate required driver fields ONLY if registering as driver
        if (userRole === 'driver') {
            if (!vehicleNumber || !licenseNumber) {
                return res.status(400).json({
                    message: 'Vehicle number and license number are required'
                });
            }
        }

        // Delete used OTP
        await EmailVerification.deleteOne({ _id: verification._id });

        logger.info(`Creating User with role: ${userRole}...`);

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            phone,
            role: userRole,
            accountStatus: accountStatus
        });

        // Create driver profile ONLY if role is driver
        if (userRole === 'driver') {
            logger.info('Creating driver profile for:', user.email);
            const driver = await Driver.create({
                userId: user._id,
                name: name,
                phone: phone,
                vehicleType: vehicleType || 'bike',
                vehicleNumber: vehicleNumber,
                licenseNumber: licenseNumber
            });
            logger.info('✅ Driver profile created successfully:', driver._id);
        } else {
            logger.info(`✅ Admin user created successfully (Status: ${accountStatus})`);
        }

        logger.info('✅ Registration completed for:', user.email);

        // Send welcome notifications
        notificationService.sendWelcomeEmail(user.email, user.name);
        if (userRole === 'driver') {
            notificationService.sendWelcomeSMS(user.phone, user.name);
        }

        // Generate token only if active
        let token = null;
        if (user.accountStatus === 'active') {
            token = generateToken(user._id);
        }

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                accountStatus: user.accountStatus
            },
            message: user.accountStatus === 'pending'
                ? 'Admin account created. Please wait for another admin to approve you.'
                : 'Registration successful'
        });
    } catch (error) {
        logger.error('❌ Registration error:', error);
        logger.error('Error stack:', error.stack);
        // Clean up user if created but driver failed
        // Note: In production use transactions
        const { email } = req.body;
        if (email) {
            const user = await User.findOne({ email });
            if (user && !await Driver.findOne({ userId: user._id })) {
                await User.deleteOne({ _id: user._id });
                logger.info('Rollback: Deleted orphaned user', user._id);
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
        const { email, emailOrPhone, password } = req.body;
        const identifier = emailOrPhone || email;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide email/phone and password' });
        }

        // Check for user by email OR phone
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Security Check: Block Pending Admins
        if (user.role === 'admin' && user.accountStatus === 'pending') {
            return res.status(403).json({
                message: 'Your admin account is pending approval. Please contact an existing administrator.'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        let driverInfo = {};
        if (user.role === 'driver') {
            const driver = await Driver.findOne({ userId: user._id });
            if (driver) {
                driverInfo = {
                    verificationStatus: driver.verificationStatus,
                    verificationNotes: driver.verificationNotes
                };
            }
        }

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                ...driverInfo
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
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
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Auth check error:', error);
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

        // Create reset URL - use FRONTEND_URL from env or fallback to localhost
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/resetpassword/${resetToken}`;

        // Send password reset email
        await notificationService.sendPasswordResetEmail(user.email, resetUrl, user.name);

        // Also log to console for development
        logger.info('====================================================');
        logger.info('PASSWORD RESET LINK:');
        logger.info(resetUrl);
        logger.info('====================================================');

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (error) {
        logger.error('Forgot password error:', error);
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
        logger.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
