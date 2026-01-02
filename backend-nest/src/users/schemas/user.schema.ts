import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    })
    email: string;

    @Prop({
        required: [true, 'Password is required'],
        minlength: 6,
        select: false,
    })
    password: string;

    @Prop({ required: [true, 'Name is required'], trim: true })
    name: string;

    @Prop({ required: [true, 'Phone number is required'], trim: true })
    phone: string;

    @Prop({
        type: String,
        enum: ['driver', 'restaurant', 'admin'],
        required: [true, 'Role is required'],
    })
    role: string;

    @Prop({
        type: String,
        enum: ['active', 'pending', 'rejected', 'suspended'],
        default: 'active',
    })
    accountStatus: string;

    @Prop({ default: '' })
    profilePhoto: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    resetPasswordToken: string;

    @Prop()
    resetPasswordExpire: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Methods
UserSchema.methods.comparePassword = async function (this: UserDocument, candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getResetPasswordToken = function (this: UserDocument) {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
};
