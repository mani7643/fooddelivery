import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { DriversModule } from './drivers/drivers.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './common/notification/notification.module';
import { LoggerModule } from './common/logger/logger.module';
import { LoggingInterceptor } from './common/logger/logging.interceptor';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { GatewayModule } from './gateway/gateway.module';
import { DocumentsModule } from './documents/documents.module';

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
})
export class AppModule { }
