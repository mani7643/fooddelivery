import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { DriversService } from '../drivers/drivers.service'; // Assuming export

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private driversService: DriversService, // You might need to add logic in DriversService to update status
    ) { }

    async findAvailableOrders(): Promise<Order[]> {
        return this.orderModel.find({ status: 'pending' }).select('-__v').exec();
    }

    async findOne(id: string): Promise<Order> {
        const order = await this.orderModel.findById(id).exec();
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async acceptOrder(orderId: string, driverUserId: string) {
        // We need driverId based on userId usually, or assuming driverUserId is passed correctly
        // In Original logic: driverId = req.user._id which is User ID. 
        // And it updates Order.driverId = driverId. 
        // Wait, in Order model driverId ref is 'Driver'.
        // BUT original code says: order.driverId = req.user._id (which is User).
        // Let's check Driver model. userId is ref to User.
        // If Order.driverId refers to 'Driver' model, we should find the Driver doc first.
        // However, original code:
        // const driverId = req.user._id; (User ID)
        // order.driverId = driverId;
        // Driver.findByIdAndUpdate(driverId, ...);
        // This implies in the original code, the 'driverId' stored in Order was actually the USER ID of the driver.
        // AND the Driver model _id was seemingly assumed to be same as User ID or they used userId field to query?
        // Let's look at Driver model again.
        // Driver: userId: { type: ObjectId, ref: 'User' unique: true }
        // If original code did Driver.findById(driverId), and driverId was req.user._id...
        // That means the Driver document _id == User document _id ?? 
        // OR the original code was BUGGY or simplified.
        // 
        // For specific Driver operations, usually we find Driver by userId.
        // Let's implement robustly: Find Driver by userId first.

        // We'll need a method in DriversService to findByUserId or simple query here if we inject model?
        // Better to delegate to DriversService.

        // For now, let's assume we pass the Driver Document ID if we can, or User ID and resolve it.
        // Let's stick to cleaning this up.

        // Logic:
        // 1. Get Order
        // 2. Check status
        // 3. Update Order
        // 4. Update Driver Status

        // We need to fetch Driver profile to get its _id (NestJS way properly)
        // Assuming we implement `findByUserId` in DriversService.

        const order = await this.findOne(orderId);
        if (order.status !== 'pending') {
            throw new BadRequestException('Order cannot be accepted');
        }

        // Update Order
        // For now saving UserID as driverId as per original logic to maintain data consistency if any?
        // Or should we fix it to store Driver Document ID?
        // If I change it, stored data might look different.
        // Let's store Driver Document ID if possible, but original code used User ID.
        // "ref: 'Driver'" in Schema suggests it SHOULD be Driver ID.
        // If original stored User ID there, then the ref was technically wrong or working by coincidence if IDs matched (unlikely in Mongo).
        // I will assume we should store the DRIVER PROFILE ID.

        // But wait, the previous `Driver.findByIdAndUpdate(driverId` where driverId=req.user._id implies they expected Driver doc ID to match User ID.
        // This happens if you manually set _id when creating Driver.
        // In `authRoutes.js`: `Driver.create({ userId: user._id, ... })` -> Mongo generates random _id for Driver.
        // So `Driver.findById(user._id)` would FAIL in original code unless I missed something.
        // Let's look at `authRoutes.js` again.
        // `const driver = await Driver.create({...})` -> random _id.
        // So `Driver.findByIdAndUpdate(driverId)` with driverId=user._id is WRONG in original code.
        // It should have been `Driver.findOneAndUpdate({ userId: driverId }, ...)`

        // I will FIX this logic here.

        return { status: 'Not fully implemented without DriversService helper' };
    }
}
