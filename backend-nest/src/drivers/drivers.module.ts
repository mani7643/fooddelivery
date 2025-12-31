import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schemas/driver.schema';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
        forwardRef(() => OrdersModule),
    ],
    controllers: [DriversController],
    providers: [DriversService],
    exports: [DriversService],
})
export class DriversModule { }
