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
<<<<<<< HEAD
        origin: '*', // We'll rely on global CORS or specific configuration if needed
=======
        origin: '*',
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
        credentials: true,
    },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger = new Logger('AppGateway');
<<<<<<< HEAD
    // Map to track socketId -> driverId key-value pairs
    private socketDriverMap = new Map<string, string>();
=======
    private socketDriverMap = new Map<string, string>();
    private disconnectTimeouts = new Map<string, NodeJS.Timeout>();
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)

    constructor(private driversService: DriversService) { }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        if (this.socketDriverMap.has(client.id)) {
            const driverId = this.socketDriverMap.get(client.id)!;
<<<<<<< HEAD
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
=======
            this.logger.log(`Driver ${driverId} disconnected. Waiting for grace period...`);

            // Clear any existing timeout for this driver (shouldn't be multiple usually, but safety first)
            if (this.disconnectTimeouts.has(driverId)) {
                clearTimeout(this.disconnectTimeouts.get(driverId));
            }

            // Set a timeout to mark offline
            const timeout = setTimeout(async () => {
                this.logger.log(`Grace period over for Driver ${driverId}. Setting status to unavailable.`);

                try {
                    await this.driversService.updateAvailability(driverId, false);
                } catch (error) {
                    this.logger.error('Error handling disconnect', error);
                }

                this.server.emit('driverStatusUpdate', {
                    driverId,
                    isAvailable: false,
                });
                this.disconnectTimeouts.delete(driverId);
            }, 5000); // 5 seconds grace period

            this.disconnectTimeouts.set(driverId, timeout);
            this.socketDriverMap.delete(client.id);
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
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
<<<<<<< HEAD
                // Store Driver Document ID not User ID
                this.socketDriverMap.set(client.id, driver._id.toString());
                this.logger.log(`Mapped socket ${client.id} to Driver ${driver._id}`);
=======
                const driverId = driver._id.toString();
                this.socketDriverMap.set(client.id, driverId);
                this.logger.log(`Mapped socket ${client.id} to Driver ${driverId}`);

                // If there was a pending disconnect (e.g. from page refresh), cancel it!
                if (this.disconnectTimeouts.has(driverId)) {
                    this.logger.log(`Driver ${driverId} reconnected within grace period. Cancelling offline status.`);
                    clearTimeout(this.disconnectTimeouts.get(driverId));
                    this.disconnectTimeouts.delete(driverId);

                    // Optional: Ensure they are physically marked online if they weren't already?
                    // Usually they are already online in DB. 
                    // But if they came back, let's just leave it as is or maybe emit active status?
                }
>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
            }
        }
    }

    @SubscribeMessage('updateLocation')
<<<<<<< HEAD
    handleLocationUpdate(@MessageBody() data: { driverId: string; location: any }, @ConnectedSocket() client: Socket) {
        const { driverId, location } = data;
        // Redundant map set
        if (!this.socketDriverMap.has(client.id)) {
            this.socketDriverMap.set(client.id, driverId);
        }
=======
    async handleLocationUpdate(@MessageBody() data: { driverId: string; location: any }, @ConnectedSocket() client: Socket) {
        const { driverId, location } = data;
        if (!this.socketDriverMap.has(client.id)) {
            this.socketDriverMap.set(client.id, driverId);
        }

        // Persist location to DB
        try {
            await this.driversService.updateLocation(driverId, location.latitude, location.longitude);
        } catch (err) {
            this.logger.error(`Failed to update location for driver ${driverId}`, err);
        }

>>>>>>> ba977d1 (fix: resolve online status race condition, add active orders endpoint, impl api logging)
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
