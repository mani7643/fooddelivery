import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationModule } from '../common/notification/notification.module';

@Module({
    imports: [UsersModule, DriversModule, NotificationModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
