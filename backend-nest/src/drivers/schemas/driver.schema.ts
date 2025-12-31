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
        required: true,
    })
    coordinates: number[];
}

@Schema()
class BankDetails {
    @Prop()
    bankName: string;

    @Prop()
    accountNumber: string;

    @Prop()
    ifscCode: string;
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
}

@Schema({ timestamps: true })
export class Driver {
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

    @Prop({ default: 0 })
    totalEarnings: number;

    @Prop({
        type: String,
        enum: ['idle', 'active', 'offline'],
        default: 'offline',
    })
    currentStatus: string;

    @Prop({ type: BankDetails })
    bankDetails: BankDetails;

    @Prop({
        type: String,
        enum: ['pending_verification', 'pending_documents', 'verified', 'rejected'],
        default: 'pending_documents',
    })
    verificationStatus: string;

    @Prop()
    verificationNotes: string;

    @Prop()
    verifiedAt: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    verifiedBy: User;

    @Prop({ type: Documents })
    documents: Documents;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
DriverSchema.index({ currentLocation: '2dsphere' });
