import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Driver, DriverDocument } from './schemas/driver.schema';

@Injectable()
export class DriversService {
    constructor(@InjectModel(Driver.name) private driverModel: Model<DriverDocument>) { }

    async findByUserId(userId: string): Promise<DriverDocument | null> {
        return this.driverModel.findOne({ userId: userId as any }).exec();
    }

    async updateAvailability(driverId: string, isAvailable: boolean) {
        return this.driverModel.findByIdAndUpdate(driverId, { isAvailable }, { new: true }).exec();
    }

    async updateStatus(userId: string, isAvailable: boolean, currentStatus: string) {
        return this.driverModel.findOneAndUpdate(
            { userId: userId as any },
            { isAvailable, currentStatus },
            { new: true }
        ).exec();
    }
}
