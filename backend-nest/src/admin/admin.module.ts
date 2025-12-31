import { Module } from '@nestjs/common';
<<<<<<< HEAD
=======
import { MongooseModule } from '@nestjs/mongoose';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationModule } from '../common/notification/notification.module';
<<<<<<< HEAD

@Module({
    imports: [UsersModule, DriversModule, NotificationModule],
=======
import { User, UserSchema } from '../users/schemas/user.schema';
import { Driver, DriverSchema } from '../drivers/schemas/driver.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Driver.name, schema: DriverSchema },
        ]),
        UsersModule, DriversModule, NotificationModule
    ],
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
