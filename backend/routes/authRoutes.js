import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import PhoneVerification from '../models/PhoneVerification.js';
import EmailVerification from '../models/EmailVerification.js';
import notificationService from '../services/notificationService.js';

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
        console.log('📧 [EMAIL-OTP] Received send-email-otp request');
        const { email } = req.body;

        if (!email) {
            console.log('❌ [EMAIL-OTP] No email provided');
            return res.status(400).json({ message: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ [EMAIL-OTP] Invalid email format');
            return res.status(400).json({ message: 'Invalid email format' });
        }

        console.log(`📧 [EMAIL-OTP] Processing for email: ${email}`);

        // Check if email already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`⚠️ [EMAIL-OTP] Email ${email} already registered`);
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔢 [EMAIL-OTP] Generated OTP for ${email}: ${otp}`);

        // Save OTP to DB (upsert)
        console.log(`💾 [EMAIL-OTP] Saving to database...`);
        const verification = await EmailVerification.findOneAndUpdate(
            { email },
            { email, otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );
        console.log(`✅ [EMAIL-OTP] Saved to database with ID: ${verification._id}`);

        // Send OTP via email
        await notificationService.sendOtpEmail(email, otp);
        console.log('====================================================');
        console.log(`📧 OTP FOR ${email}: ${otp}`);
        console.log(`⏰ Valid for 5 minutes`);
        console.log('====================================================');

        res.json({ success: true, message: 'OTP sent to your email' });
        console.log(`✅ [EMAIL-OTP] Response sent successfully for ${email}`);
    } catch (error) {
        console.error('❌ [EMAIL-OTP] Send OTP error:', error);
        console.error('Error details:', {
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
        console.log('📞 [OTP] Received send-otp request');
        const { phone } = req.body;

        if (!phone) {
            console.log('❌ [OTP] No phone number provided');
            return res.status(400).json({ message: 'Phone number is required' });
        }

        console.log(`📞 [OTP] Processing for phone: ${phone}`);

        // Check if phone already registered
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            console.log(`⚠️ [OTP] Phone ${phone} already registered`);
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔢 [OTP] Generated OTP for ${phone}: ${otp}`);

        // Save OTP to DB (upsert)
        console.log(`💾 [OTP] Saving to database...`);
        const verification = await PhoneVerification.findOneAndUpdate(
            { phone },
            { phone, otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );
        console.log(`✅ [OTP] Saved to database with ID: ${verification._id}`);

        // Simulate sending SMS
        console.log('====================================================');
        console.log(`📱 OTP FOR ${phone}: ${otp}`);
        console.log(`⏰ Valid for 5 minutes`);
        console.log('====================================================');

        res.json({ success: true, message: 'OTP sent successfully' });
        console.log(`✅ [OTP] Response sent successfully for ${phone}`);
    } catch (error) {
        console.error('❌ [OTP] Send OTP error:', error);
        console.error('Error details:', {
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

        console.log(`Creating User with role: ${userRole}...`);

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
            console.log('Creating driver profile for:', user.email);
            const driver = await Driver.create({
                userId: user._id,
                name: name,
                phone: phone,
                vehicleType: vehicleType || 'bike',
                vehicleNumber: vehicleNumber,
                licenseNumber: licenseNumber
            });
            console.log('✅ Driver profile created successfully:', driver._id);
        } else {
            console.log(`✅ Admin user created successfully (Status: ${accountStatus})`);
        }

        console.log('✅ Registration completed for:', user.email);

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
                role: user.role
            }
        });
    } catch (error) {
        console.error('Auth check error:', error);
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
        console.log('====================================================');
        console.log('PASSWORD RESET LINK:');
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
