import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(createUserDto: any): Promise<User> {
        const createdUser = new this.userModel(createUserDto);
        return createdUser.save();
    }

    async findOne(email: string): Promise<User | null> {
        if (!email) return null;
        return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
    }

    async findById(id: string): Promise<User | null> {
        return this.userModel.findById(id).exec();
    }

    async delete(id: string): Promise<any> {
        return this.userModel.findByIdAndDelete(id).exec();
    }

    async countAdmins(): Promise<number> {
        return this.userModel.countDocuments({ role: 'admin' }).exec();
    }
}
