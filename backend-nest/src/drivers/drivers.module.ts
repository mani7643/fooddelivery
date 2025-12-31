<<<<<<< HEAD
import { Module } from '@nestjs/common';
=======
import { Module, forwardRef } from '@nestjs/common';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schemas/driver.schema';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
<<<<<<< HEAD
=======
import { OrdersModule } from '../orders/orders.module';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
<<<<<<< HEAD
    ],
    controllers: [DriversController],
    providers: [DriversService],
    exports: [DriversService, MongooseModule],
=======
        forwardRef(() => OrdersModule),
    ],
    controllers: [DriversController],
    providers: [DriversService],
    exports: [DriversService],
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
})
export class DriversModule { }
