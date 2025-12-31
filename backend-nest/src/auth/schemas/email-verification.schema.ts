import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailVerificationDocument = EmailVerification & Document;

@Schema({ timestamps: true })
export class EmailVerification {
<<<<<<< HEAD
    @Prop({
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    })
=======
    @Prop({ required: true })
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
    email: string;

    @Prop({ required: true })
    otp: string;

<<<<<<< HEAD
    @Prop({
        type: Date,
        default: Date.now,
        expires: 300, // 5 minutes
    })
    createdAt: Date;
=======
    @Prop({ type: Date, expires: '10m', default: Date.now }) // Expire after 10 mins
    createdAt: Date;

    @Prop()
    expiresAt: Date;
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
