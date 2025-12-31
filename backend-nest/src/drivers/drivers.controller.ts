import { Controller, Get, Put, Post, Body, UseGuards, Request, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';

@Controller('driver')
export class DriversController {
    constructor(
        private driversService: DriversService,
        @Inject(forwardRef(() => OrdersService)) private ordersService: OrdersService
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('orders/active')
    async getActiveOrders(@Request() req) {
        const driver = await this.driversService.findByUserId(req.user._id);
        if (!driver) throw new NotFoundException('Driver not found');

        const orders = await this.ordersService.findActiveOrdersForDriver(driver._id.toString());
        return { success: true, orders };
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        // req.user from JwtStrategy has userId, role, email etc.
        // req.user.sub is often the ID, or req.user._id depending on strategy payload.
        // AuthService.login payload: sub: user._id.
        // JwtStrategy validate: return { userId: payload.sub, ... } (Need to verify this)
        const driver = await this.driversService.findByUserId(req.user._id);

        if (!driver) {
            throw new NotFoundException('Driver profile not found');
        }
        return { success: true, driver };
    }

    // ... existing endpoints ...

    @UseGuards(JwtAuthGuard)
    @Put('availability')
    async updateAvailability(@Request() req, @Body() body: { isAvailable: boolean }) {
        const driver = await this.driversService.findByUserId(req.user._id);
        if (!driver) throw new NotFoundException('Driver not found');

        const updated = await this.driversService.updateAvailability(driver._id.toString(), body.isAvailable);
        if (!updated) throw new NotFoundException('Driver update failed');
        return { success: true, isAvailable: updated.isAvailable };
    }

    @UseGuards(JwtAuthGuard)
    @Post('confirm-documents')
    async confirmDocuments(@Request() req, @Body() body: any) {
        // body should contain documents: { license, registration, insurance }
        const driver = await this.driversService.findByUserId(req.user._id);
        if (!driver) throw new NotFoundException('Driver not found');

        const updated = await this.driversService.updateDocuments(driver._id.toString(), body.documents);
        return { success: true, driver: updated };
    }

    @UseGuards(JwtAuthGuard)
    @Get('documents')
    async getDocuments(@Request() req) {
        const driver = await this.driversService.findByUserId(req.user._id);
        if (!driver) throw new NotFoundException('Driver not found');

        return {
            success: true,
            verificationStatus: driver.verificationStatus,
            documents: driver.documents,
            verificationNotes: driver.verificationNotes
        };
    }
}
