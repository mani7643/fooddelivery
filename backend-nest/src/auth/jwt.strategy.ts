import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
        });
    }

    async validate(payload: any) {
<<<<<<< HEAD
        const user = await this.usersService.findById(payload.id);
        if (!user) {
            throw new UnauthorizedException();
        }
        // We can check accountStatus here if desired, similar to original authMiddleware
        if (user.accountStatus === 'pending') {
            // NestJS doesn't have a standard Forbidden for this inside validate easily without customized handleRequest,
            // but throwing Unauthorized is standard, or Forbidden logic in Guards.
            // Original middleware returned 403.
            // We'll let the user pass here and handle specific guard or just throw ForbiddenException
            // But strategy validate usually returns the user object.
            // Let's attach status to user and handle in Guard or controller.
        }
=======
        // Payload has sub (id) and email usually
        const user = await this.usersService.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedException();
        }
        // Check account status if needed (e.g. pending admin)
        // Original middleware: if (user.role === 'admin' && user.accountStatus === 'pending') -> 403
        // We can do it here or in Guards.
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        return user;
    }
}
