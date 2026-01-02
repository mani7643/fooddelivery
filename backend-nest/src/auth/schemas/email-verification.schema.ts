import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailVerificationDocument = EmailVerification & Document;

@Schema({ timestamps: true })
export class EmailVerification {
    @Prop({
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    })
    email: string;

    @Prop({ required: true })
    otp: string;

    @Prop({
        type: Date,
        default: Date.now,
        expires: 300, // 5 minutes
    })
    createdAt: Date;

    @Prop({ required: true })
    expiresAt: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);


