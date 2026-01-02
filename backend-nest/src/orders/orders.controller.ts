import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Get('available')
    async getAvailableOrders(@Request() req) {
        if (req.user.role !== 'driver') {
            throw new ForbiddenException('Only drivers can see available orders');
        }
        const orders = await this.ordersService.findAvailableOrders();
        return { success: true, orders };
    }
}
