import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DriversModule } from '../drivers/drivers.module';
import { UsersModule } from '../users/users.module';

@Module({
        imports: [
                MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
                forwardRef(() => DriversModule),
                UsersModule,
        ],
        controllers: [OrdersController],
        providers: [OrdersService],
        exports: [OrdersService],
})
export class OrdersModule { }
