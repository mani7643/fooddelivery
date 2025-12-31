import { Controller, Get, Put, Query, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
<<<<<<< HEAD
// import { RolesGuard } from '../auth/guards/roles.guard';
=======
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    private checkAdmin(req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access only');
        }
    }

    @Get('stats')
    async getStats(@Request() req) {
        this.checkAdmin(req);
        const stats = await this.adminService.getStats();
        return { success: true, stats };
    }

    @Get('pending-verifications')
    async getPendingVerifications(@Request() req) {
        this.checkAdmin(req);
        const drivers = await this.adminService.getPendingVerifications();
        return { success: true, drivers };
    }

    @Put('verify-driver/:driverId')
    async verifyDriver(@Request() req, @Param('driverId') driverId: string, @Body() body: { status: string; notes?: string }) {
        this.checkAdmin(req);
        const driver = await this.adminService.verifyDriver(driverId, body.status, body.notes, req.user._id);
        return { success: true, message: `Driver ${body.status} successfully`, driver };
    }

    @Get('drivers')
    async getDrivers(@Request() req, @Query('status') status: string, @Query('search') search: string) {
        this.checkAdmin(req);
        const drivers = await this.adminService.getDrivers(status, search);
        return { success: true, drivers };
    }

    @Get('online-drivers')
    async getOnlineDrivers(@Request() req) {
        this.checkAdmin(req);
        const drivers = await this.adminService.getOnlineDrivers();
        return { success: true, drivers };
    }

    @Get('pending-admins')
    async getPendingAdmins(@Request() req) {
        this.checkAdmin(req);
        const admins = await this.adminService.getPendingAdmins();
        return { success: true, admins };
    }

    @Put('approve-admin/:userId')
    async approveAdmin(@Request() req, @Param('userId') userId: string) {
        this.checkAdmin(req);
        const user = await this.adminService.approveAdmin(userId);
        return {
            success: true,
            message: 'Admin approved',
            user: { id: user._id, name: user.name, email: user.email, role: user.role, accountStatus: user.accountStatus }
        };
    }
}
