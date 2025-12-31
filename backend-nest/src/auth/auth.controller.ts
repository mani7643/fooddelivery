import { Controller, Post, Body, UnauthorizedException, Request, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: any) {
        // Support both strict 'email' and 'emailOrPhone' to match legacy behavior
        const identifier = body.email || body.emailOrPhone;

        // validateUser might throw if account is pending
        const user = await this.authService.validateUser(identifier, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('send-email-otp')
    async sendEmailOtp(@Body() body: { email: string }) {
        return this.authService.sendEmailOtp(body.email);
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req) {
        return { user: req.user };
    }
}
