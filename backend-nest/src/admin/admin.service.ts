import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Driver, DriverDocument } from '../drivers/schemas/driver.schema';
import { NotificationService } from '../common/notification/notification.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
        private notificationService: NotificationService,
    ) { }

    async getPendingVerifications() {
        return this.driverModel.find({
            verificationStatus: { $in: ['pending_verification', 'pending_documents'] },
        }).populate('userId', 'name email phone').exec();
    }

    async verifyDriver(driverId: string, status: string, notes: string | undefined, adminId: string) {
        if (!['verified', 'rejected', 'pending_verification'].includes(status)) {
            throw new BadRequestException('Invalid status');
        }

        const driver = await this.driverModel.findById(driverId).populate<{ userId: UserDocument }>('userId', 'name email').exec();
        if (!driver) throw new NotFoundException('Driver not found');

        driver.verificationStatus = status;
        driver.verificationNotes = notes || '';
        if (status === 'verified') {
            driver.verifiedAt = new Date();
<<<<<<< HEAD
            driver.verifiedBy = adminId as any; // Cast if User type mismatch
=======
            driver.verifiedBy = adminId as any;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        }

        await driver.save();

<<<<<<< HEAD
        // Notifications
=======
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        const { email, name } = driver.userId;
        if (status === 'verified') {
            await this.notificationService.sendVerificationApprovalEmail(email, name);
        } else if (status === 'rejected') {
            await this.notificationService.sendVerificationRejectionEmail(email, name, notes || 'No reason provided');
        }

        return driver;
    }

    async getStats() {
        const [totalUsers, totalDrivers, pendingVerification, verifiedDrivers, rejectedDrivers, onlineDrivers] = await Promise.all([
            this.userModel.countDocuments().exec(),
            this.driverModel.countDocuments().exec(),
            this.driverModel.countDocuments({ verificationStatus: 'pending_verification' }).exec(),
            this.driverModel.countDocuments({ verificationStatus: 'verified' }).exec(),
            this.driverModel.countDocuments({ verificationStatus: 'rejected' }).exec(),
            this.driverModel.countDocuments({ verificationStatus: 'verified', isAvailable: true }).exec(),
        ]);

        return {
            totalUsers,
            totalDrivers,
            pendingVerification,
            verifiedDrivers,
            rejectedDrivers,
            onlineDrivers
        };
    }

    async getDrivers(status?: string, search?: string) {
        const filter: any = {};
        if (status) filter.verificationStatus = status;

        if (search) {
            const matchingUsers = await this.userModel.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            }).select('_id').exec();

            filter.userId = { $in: matchingUsers.map(u => u._id) };
        }

        return this.driverModel.find(filter)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 })
            .exec();
    }

    async getOnlineDrivers() {
        return this.driverModel.find({
            verificationStatus: 'verified',
            isAvailable: true
        })
            .select('userId name phone vehicleType vehicleNumber currentLocation currentStatus')
            .populate('userId', 'name email phone')
            .exec();
    }

    async getPendingAdmins() {
        return this.userModel.find({
            role: 'admin',
            accountStatus: 'pending'
        }).select('-password').exec();
    }

    async approveAdmin(userId: string) {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException('User not found');
        if (user.role !== 'admin') throw new BadRequestException('User is not admin');

        user.accountStatus = 'active';
        return user.save();
    }
}
