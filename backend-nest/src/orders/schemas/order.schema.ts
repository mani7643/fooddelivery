import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
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
    restaurantId: MongooseSchema.Types.ObjectId; // Keeping standard ObjectId until Restaurant Module exists

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    customerId: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Driver', default: null })
    driverId: Driver;

    @Prop({ type: [OrderItem] })
    items: OrderItem[];

    @Prop({ required: true, min: 0 })
    totalAmount: number;

    @Prop(raw({
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }
    }))
    pickupLocation: { type: string; coordinates: number[] };

    @Prop(raw({
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }
    }))
    dropoffLocation: { type: string; coordinates: number[] };

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
