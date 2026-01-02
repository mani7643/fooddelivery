import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type DriverDocument = Driver & Document;

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
        default: [0, 0],
    })
    coordinates: number[];
}

@Schema()
class BankDetails {
    @Prop()
    accountHolderName: string;

    @Prop()
    accountNumber: string;

    @Prop()
    ifscCode: string;

    @Prop()
    bankName: string;
}

@Schema()
class Documents {
    @Prop()
    aadhaarFront: string;

    @Prop()
    aadhaarBack: string;

    @Prop()
    dlFront: string;

    @Prop()
    dlBack: string;

    @Prop()
    panCard: string;

    @Prop()
    vehicleRC: string;
}

@Schema({ timestamps: true })
export class Driver {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: User;

    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    phone: string;

    @Prop({
        type: String,
        enum: ['bike', 'scooter', 'car', 'bicycle'],
        required: [true, 'Vehicle type is required'],
    })
    vehicleType: string;

    @Prop({
        required: [true, 'Vehicle number is required'],
        trim: true,
        uppercase: true,
    })
    vehicleNumber: string;

    @Prop({
        required: [true, 'License number is required'],
        trim: true,
        uppercase: true,
    })
    licenseNumber: string;

    @Prop(raw({
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    }))
    currentLocation: { type: string; coordinates: number[] };

    @Prop({ default: false })
    isAvailable: boolean;

    @Prop({
        type: String,
        enum: ['idle', 'active', 'onTrip'],
        default: 'idle',
    })
    currentStatus: string;

    @Prop({ default: 0, min: 0, max: 5 })
    rating: number;

    @Prop({ default: 0 })
    totalDeliveries: number;

    @Prop({ default: 0 })
    totalEarnings: number;

    @Prop({ default: 0 })
    todayEarnings: number;

    @Prop({ type: BankDetails })
    bankDetails: BankDetails;

    @Prop({ type: Documents })
    documents: Documents;

    @Prop({
        type: String,
        enum: ['pending_documents', 'pending_verification', 'verified', 'rejected'],
        default: 'pending_documents',
    })
    verificationStatus: string;

    @Prop()
    verificationNotes: string;

    @Prop()
    verifiedAt: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    verifiedBy: User;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
DriverSchema.index({ currentLocation: '2dsphere' });
