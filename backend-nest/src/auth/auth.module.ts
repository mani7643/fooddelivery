import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationModule } from '../common/notification/notification.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
=======
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { DriversModule } from '../drivers/drivers.module';
import { NotificationModule } from '../common/notification/notification.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
import { EmailVerification, EmailVerificationSchema } from './schemas/email-verification.schema';

@Module({
    imports: [
        UsersModule,
        DriversModule,
        NotificationModule,
        PassportModule,
<<<<<<< HEAD
=======
        ConfigModule,
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRE') || '1d') as any },
            }),
            inject: [ConfigService],
        }),
<<<<<<< HEAD
        MongooseModule.forFeature([
            { name: EmailVerification.name, schema: EmailVerificationSchema },
        ]),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService, JwtModule],
=======
        MongooseModule.forFeature([{ name: EmailVerification.name, schema: EmailVerificationSchema }]),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
})
export class AuthModule { }
