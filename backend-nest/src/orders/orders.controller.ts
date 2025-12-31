import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
<<<<<<< HEAD
// import { RolesGuard } from '../common/guards/roles.guard'; // If we implement it
// import { Roles } from '../common/decorators/roles.decorator';
=======
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get('available')
    async getAvailableOrders(@Request() req) {
<<<<<<< HEAD
        // Check role manually or via guard
=======
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        if (req.user.role !== 'driver') {
            throw new ForbiddenException('Only drivers can see available orders');
        }
        const orders = await this.ordersService.findAvailableOrders();
        return { success: true, orders };
    }
}
