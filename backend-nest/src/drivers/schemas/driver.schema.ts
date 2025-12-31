import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
<<<<<<< HEAD
        default: [0, 0],
=======
        required: true,
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
    })
    coordinates: number[];
}

@Schema()
class BankDetails {
    @Prop()
<<<<<<< HEAD
    accountHolderName: string;
=======
    bankName: string;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

    @Prop()
    accountNumber: string;

    @Prop()
    ifscCode: string;
<<<<<<< HEAD

    @Prop()
    bankName: string;
=======
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
}

@Schema()
class Documents {
    @Prop()
    aadhaarFront: string;
<<<<<<< HEAD
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
=======

    @Prop()
    aadhaarBack: string;

    @Prop()
    dlFront: string;

    @Prop()
    dlBack: string;

    @Prop()
    panCard: string;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
}

@Schema({ timestamps: true })
export class Driver {
<<<<<<< HEAD
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

    @Prop({ type: Location, index: '2dsphere' })
    currentLocation: Location;

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
=======
    // We reference the User who is this driver
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: User;

    @Prop()
    vehicleType: string;

    @Prop()
    vehicleNumber: string;

    @Prop()
    licenseNumber: string;

    @Prop({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
        _id: false,
    })
    currentLocation: { type: string; coordinates: number[] };

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ default: 0 })
    rating: number;

    @Prop({ default: 0 })
    totalRatings: number;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

    @Prop({ default: 0 })
    totalEarnings: number;

<<<<<<< HEAD
    @Prop({ default: 0 })
    todayEarnings: number;
=======
    @Prop({
        type: String,
        enum: ['idle', 'active', 'offline'],
        default: 'offline',
    })
    currentStatus: string;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

    @Prop({ type: BankDetails })
    bankDetails: BankDetails;

<<<<<<< HEAD
    @Prop({ type: Documents })
    documents: Documents;

    @Prop({
        type: String,
        enum: ['pending_documents', 'pending_verification', 'verified', 'rejected'],
=======
    @Prop({
        type: String,
        enum: ['pending_verification', 'pending_documents', 'verified', 'rejected'],
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        default: 'pending_documents',
    })
    verificationStatus: string;

    @Prop()
    verificationNotes: string;

    @Prop()
    verifiedAt: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    verifiedBy: User;
<<<<<<< HEAD
=======

    @Prop({ type: Documents })
    documents: Documents;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
DriverSchema.index({ currentLocation: '2dsphere' });
