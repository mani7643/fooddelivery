import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
<<<<<<< HEAD
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService, MongooseModule],
=======
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
})
export class UsersModule { }
