import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationModule } from '../common/notification/notification.module';
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
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
