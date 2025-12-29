import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { DriversService } from '../drivers/drivers.service';

@WebSocketGateway({
    cors: {
        origin: '*', // We'll rely on global CORS or specific configuration if needed
        credentials: true,
    },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger = new Logger('AppGateway');
    // Map to track socketId -> driverId key-value pairs
    private socketDriverMap = new Map<string, string>();

    constructor(private driversService: DriversService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        if (this.socketDriverMap.has(client.id)) {
            const driverId = this.socketDriverMap.get(client.id)!;
            this.logger.log(`Driver ${driverId} disconnected. Setting status to unavailable.`);

            try {
                await this.driversService.updateAvailability(driverId, false);
            } catch (error) {
                this.logger.error('Error handling disconnect', error);
            }

            this.socketDriverMap.delete(client.id);
            this.server.emit('driverStatusUpdate', {
                driverId,
                isAvailable: false,
            });
        }
    }

    @SubscribeMessage('join')
    async handleJoin(@MessageBody() data: { userId: string; role: string }, @ConnectedSocket() client: Socket) {
        const { userId, role } = data;
        client.join(`${role}_${userId}`);
        this.logger.log(`User ${userId} joined as ${role}`);

        if (role === 'driver') {
            const driver = await this.driversService.findByUserId(userId);
            if (driver) {
                // Store Driver Document ID not User ID
                this.socketDriverMap.set(client.id, driver._id.toString());
                this.logger.log(`Mapped socket ${client.id} to Driver ${driver._id}`);
            }
        }
    }

    @SubscribeMessage('updateLocation')
    handleLocationUpdate(@MessageBody() data: { driverId: string; location: any }, @ConnectedSocket() client: Socket) {
        const { driverId, location } = data;
        // Redundant map set
        if (!this.socketDriverMap.has(client.id)) {
            this.socketDriverMap.set(client.id, driverId);
        }
        this.server.emit('driverLocationUpdate', { driverId, location });
    }

    @SubscribeMessage('newOrder')
    handleNewOrder(@MessageBody() data: { restaurantId: string; order: any }) {
        const { restaurantId, order } = data;
        this.server.to(`restaurant_${restaurantId}`).emit('orderReceived', order);
    }

    @SubscribeMessage('orderStatusUpdate')
    handleOrderStatusUpdate(@MessageBody() data: any) {
        const { orderId, status, restaurantId, driverId } = data;
        if (restaurantId) {
            this.server.to(`restaurant_${restaurantId}`).emit('orderStatusChanged', { orderId, status });
        }
        if (driverId) {
            this.server.to(`driver_${driverId}`).emit('orderStatusChanged', { orderId, status });
        }
        this.server.emit('orderUpdate', { orderId, status });
    }

    @SubscribeMessage('orderAccepted')
    handleOrderAccepted(@MessageBody() data: any) {
        const { driverId } = data;
        if (driverId) {
            this.server.to(`driver_${driverId}`).emit('newDeliveryRequest', data);
        }
    }

    @SubscribeMessage('orderReady')
    handleOrderReady(@MessageBody() data: any) {
        const { driverId } = data;
        if (driverId) {
            this.server.to(`driver_${driverId}`).emit('orderReadyForPickup', data);
        }
    }
}
