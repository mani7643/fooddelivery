import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
=======
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './common/notification/notification.module';
import { LoggerModule } from './common/logger/logger.module';
<<<<<<< HEAD
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { GatewayModule } from './gateway/gateway.module';
=======
import { LoggingInterceptor } from './common/logger/logging.interceptor';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { GatewayModule } from './gateway/gateway.module';
import { DocumentsModule } from './documents/documents.module';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI') || configService.get<string>('MONGODB_URI');
        if (!uri) {
          console.warn('MONGO_URI not found, verify .env');
        }
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    LoggerModule,
    NotificationModule,
    AuthModule,
    UsersModule,
    DriversModule,
    OrdersModule,
    AdminModule,
<<<<<<< HEAD
  ],
  controllers: [AppController],
  providers: [AppService],
=======
    GatewayModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
})
export class AppModule { }
