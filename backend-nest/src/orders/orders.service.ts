import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { DriversService } from '../drivers/drivers.service';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private driversService: DriversService,
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

    async findActiveOrdersForDriver(driverId: string): Promise<Order[]> {
        return this.orderModel.find({
            driverId: driverId,
            status: { $in: ['accepted', 'pickedUp', 'enRoute'] }
        }).exec();
    }
}
