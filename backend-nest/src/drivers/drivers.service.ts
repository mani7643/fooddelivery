import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);

    constructor(@InjectModel(Driver.name) private driverModel: Model<DriverDocument>) { }

    async create(createDriverDto: any): Promise<DriverDocument> {
        this.logger.log(`Creating driver profile for user: ${createDriverDto.userId}`);
        const driverData = {
            ...createDriverDto,
            currentLocation: createDriverDto.currentLocation || { type: 'Point', coordinates: [0, 0] }
        };
        const createdDriver = new this.driverModel(driverData);
        return createdDriver.save();
    }

    async findByUserId(userId: string): Promise<DriverDocument | null> {
        this.logger.log(`Finding driver by userId: ${userId}`);
        return this.driverModel.findOne({ userId: userId as any }).populate('userId', '-password').exec();
    }

    async updateAvailability(driverId: string, isAvailable: boolean) {
        this.logger.log(`Updating driver ${driverId} availability: ${isAvailable}`);
        return this.driverModel.findByIdAndUpdate(driverId, { isAvailable }, { new: true }).exec();
    }

    async updateStatus(userId: string, isAvailable: boolean, currentStatus: string) {
        this.logger.log(`Updating driver status for user ${userId}: ${currentStatus} (${isAvailable})`);
        return this.driverModel.findOneAndUpdate(
            { userId: userId as any },
            { isAvailable, currentStatus },
            { new: true }
        ).exec();
    }

    async updateDocuments(driverId: string, documents: any) {
        this.logger.log(`Updating documents for driver ${driverId}`);
        return this.driverModel.findByIdAndUpdate(
            driverId,
            {
                documents,
                verificationStatus: 'pending_verification'
            },
            { new: true }
        ).exec();
    }

    async updateLocation(driverId: string, lat: number, lng: number) {
        // Ensure atomic update of coordinates
        return this.driverModel.findByIdAndUpdate(
            driverId,
            {
                currentLocation: {
                    type: 'Point',
                    coordinates: [lng, lat] // GeoJSON Uses [Longitude, Latitude]
                }
            },
            { new: true }
        ).exec();
    }
}
