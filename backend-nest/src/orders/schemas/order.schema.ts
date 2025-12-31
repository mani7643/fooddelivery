import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Driver } from '../../drivers/schemas/driver.schema';

export type OrderDocument = Order & Document;

@Schema()
class OrderItem {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true, min: 0 })
    price: number;
}

@Schema()
class Location {
    @Prop({
        type: String,
        enum: ['Point'],
        default: 'Point',
    })
    type: string;

    @Prop({
        type: [Number],
        required: true,
    })
    coordinates: number[];
}

@Schema({ timestamps: true })
export class Order {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', required: true })
<<<<<<< HEAD
    restaurantId: MongooseSchema.Types.ObjectId; // Keeping standard ObjectId until Restaurant Module exists
=======
    restaurantId: MongooseSchema.Types.ObjectId;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    customerId: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Driver', default: null })
    driverId: Driver;

    @Prop({ type: [OrderItem] })
    items: OrderItem[];

    @Prop({ required: true, min: 0 })
    totalAmount: number;

<<<<<<< HEAD
    @Prop({ type: Location, index: '2dsphere' })
=======
    @Prop({ type: Location })
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
    pickupLocation: Location;

    @Prop({ type: Location })
    dropoffLocation: Location;

    @Prop({
        type: String,
        enum: ['pending', 'accepted', 'pickedUp', 'enRoute', 'delivered', 'cancelled'],
        default: 'pending',
    })
    status: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ pickupLocation: '2dsphere' });
