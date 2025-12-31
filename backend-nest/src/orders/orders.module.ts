<<<<<<< HEAD
import { Module } from '@nestjs/common';
=======
import { Module, forwardRef } from '@nestjs/common';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DriversModule } from '../drivers/drivers.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
<<<<<<< HEAD
        DriversModule,
=======
        forwardRef(() => DriversModule),
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        UsersModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
