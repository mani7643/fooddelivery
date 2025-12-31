import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailVerificationDocument = EmailVerification & Document;

@Schema({ timestamps: true })
export class EmailVerification {
    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    otp: string;

    @Prop({ type: Date, expires: '10m', default: Date.now }) // Expire after 10 mins
    createdAt: Date;

    @Prop()
    expiresAt: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
