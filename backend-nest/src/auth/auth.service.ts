import { Injectable, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailVerification, EmailVerificationDocument } from './schemas/email-verification.schema';
import { NotificationService } from '../common/notification/notification.service';

import { DriversService } from '../drivers/drivers.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @InjectModel(EmailVerification.name) private emailVerificationModel: Model<EmailVerificationDocument>,
        private notificationService: NotificationService,
        private driversService: DriversService,
    ) { }

    // ... existing sendEmailOtp ...

    // ... existing verifyOtp ...

    async register(registerDto: any) {
        try {
            const { email, password, name, phone, otp, role, vehicleType, vehicleNumber, licenseNumber } = registerDto;

            // 1. Verify OTP
            const isValidOtp = await this.verifyOtp(email, otp);
            if (!isValidOtp) {
                throw new BadRequestException('Invalid or expired OTP');
            }

            // 2. Check if user exists
            const existingUser = await this.usersService.findOne(email);
            if (existingUser) {
                throw new BadRequestException('User already exists');
            }

            // 3. Determine Account Status
            let accountStatus = 'active';
            if (role === 'admin') {
                const adminCount = await this.usersService.countAdmins();
                // First admin is active, subsequent are pending
                accountStatus = adminCount === 0 ? 'active' : 'pending';
            }

            // 4. Create User
            const user = await this.usersService.create({
                email,
                password,
                name,
                phone,
                role: role || 'driver', // Default to driver if not specified
                accountStatus
            });

            // 5. Create Driver Profile if needed
            if (user.role === 'driver') {
                try {
                    await this.driversService.create({
                        userId: (user as any)._id,
                        name,
                        phone,
                        vehicleType,
                        vehicleNumber,
                        licenseNumber,
                        email
                    });
                } catch (driverError) {
                    this.logger.error('Failed to create driver profile, rolling back user creation', driverError);
                    await this.usersService.delete((user as any)._id);
                    throw new BadRequestException('Failed to create driver profile: ' + driverError.message);
                }
            }

            // 6. Delete OTP
            await this.emailVerificationModel.deleteOne({ email, otp }).exec();

            // 7. Generate Token
            // Reload user to ensure fields for login
            // const fullUser = await this.usersService.findOne(email); 
            // actually login accepts the user object we just created if it has _id

            return this.login(user); // Reuse login logic to return token + user
        } catch (error) {
            this.logger.error('Registration error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            // If it's already an HTTP exception, just throw it
            if (error instanceof BadRequestException || error.status) {
                throw error;
            }
            throw new BadRequestException(`Registration failed: ${error.message}`);
        }
    }



    async sendEmailOtp(email: string) {
        if (!email) throw new BadRequestException('Email is required');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Development logging
        this.logger.warn(`Generated OTP for ${email}: ${otp}`);

        // Upsert OTP
        await this.emailVerificationModel.findOneAndUpdate(
            { email },
            {
                email,
                otp,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            },
            { upsert: true, new: true }
        ).exec();

        await this.notificationService.sendOTP(email, otp);

        return { success: true, message: 'OTP sent successfully' };
    }

    async verifyOtp(email: string, otp: string): Promise<boolean> {
        const verification = await this.emailVerificationModel.findOne({ email, otp });
        if (!verification) return false;

        // Check expiration (optional if relying on TTL index, but manual check is safer)
        if (new Date() > verification.expiresAt) return false;

        return true;
    }



    async validateUser(email: string, pass: string): Promise<any> {
        // console.log(`Validating user: ${email}`); // Be careful logging passwords
        const user = await this.usersService.findOne(email);

        if (!user) {
            this.logger.warn(`Login failed: User not found for email ${email}`);
            return null;
        }

        // Use schema method
        // @ts-ignore
        const isMatch = await user.comparePassword(pass);

        if (!isMatch) {
            this.logger.warn(`Login failed: Password mismatch for ${email}`);
            return null;
        }

        // Check for pending admin
        if (user.role === 'admin' && user.accountStatus === 'pending') {
            this.logger.warn(`Login blocked: Pending admin account for ${email}`);
            // We need to pass this specific error up. 
            // Since AuthController expects user or null, we might need to change AuthController too
            // OR we define a convention.
            throw new UnauthorizedException('Your admin account is pending approval. Please contact an existing administrator.');
        }

        const { password, ...result } = (user as any).toObject ? (user as any).toObject() : user;
        return result;
    }

    async login(user: any) {
        try {
            const payload = { email: user.email, sub: user._id.toString(), role: user.role };

            let driverInfo = {};
            if (user.role === 'driver') {
                const driver = await this.driversService.findByUserId(user._id);
                if (driver) {
                    driverInfo = {
                        verificationStatus: driver.verificationStatus,
                        verificationNotes: driver.verificationNotes
                    };
                }
            }

            const token = this.jwtService.sign(payload);
            return {
                success: true,
                token,
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    profilePhoto: user.profilePhoto,
                    ...driverInfo
                }
            };
        } catch (error) {
            this.logger.error('Login error:', error);
            throw error;
        }
    }
}
