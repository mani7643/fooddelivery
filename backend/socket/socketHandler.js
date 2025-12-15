import Driver from '../models/Driver.js';

export default function socketHandler(io) {
    // Map to track socketId -> driverId for disconnection handling
    const socketDriverMap = new Map();

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join room based on user role and ID
        socket.on('join', (data) => {
            const { userId, role } = data;
            socket.join(`${role}_${userId}`);
            console.log(`User ${userId} joined as ${role}`);

            // If user is a driver, try to find their driverId to map it
            if (role === 'driver') {
                // We'll need the actual driverId (profile ID), not just userId. 
                // However, the frontend 'join' event sends userId.
                // Ideally, we should fetch the driver status here.
                // For now, let's optimize by asking the frontend to send driverId or lookup here.

                // Let's do a quick lookup to map socket -> driverId
                Driver.findOne({ userId: userId }).then(driver => {
                    if (driver) {
                        socketDriverMap.set(socket.id, driver._id);
                        console.log(`Mapped socket ${socket.id} to Driver ${driver._id}`);
                    }
                }).catch(err => console.error('Error mapping driver socket:', err));
            }
        });

        // Driver location update
        socket.on('updateLocation', (data) => {
            const { driverId, location } = data;

            // Ensure mapping exists (redundancy)
            if (!socketDriverMap.has(socket.id)) {
                socketDriverMap.set(socket.id, driverId);
            }

            // Broadcast to all connected clients (restaurants, customers)
            io.emit('driverLocationUpdate', { driverId, location });
        });

        // New order notification to restaurant
        socket.on('newOrder', (data) => {
            const { restaurantId, order } = data;
            io.to(`restaurant_${restaurantId}`).emit('orderReceived', order);
        });

        // Order status update
        socket.on('orderStatusUpdate', (data) => {
            const { orderId, status, restaurantId, driverId } = data;

            // Notify restaurant
            if (restaurantId) {
                io.to(`restaurant_${restaurantId}`).emit('orderStatusChanged', { orderId, status });
            }

            // Notify driver
            if (driverId) {
                io.to(`driver_${driverId}`).emit('orderStatusChanged', { orderId, status });
            }

            // Broadcast to all for real-time updates
            io.emit('orderUpdate', { orderId, status });
        });

        // Order accepted by restaurant
        socket.on('orderAccepted', (data) => {
            const { orderId, driverId } = data;
            if (driverId) {
                io.to(`driver_${driverId}`).emit('newDeliveryRequest', data);
            }
        });

        // Order ready for pickup
        socket.on('orderReady', (data) => {
            const { orderId, driverId } = data;
            if (driverId) {
                io.to(`driver_${driverId}`).emit('orderReadyForPickup', data);
            }
        });

        // Disconnect
        socket.on('disconnect', async () => {
            console.log('Client disconnected:', socket.id);

            // Check if this was a driver
            if (socketDriverMap.has(socket.id)) {
                const driverId = socketDriverMap.get(socket.id);
                console.log(`Driver ${driverId} disconnected. Setting isAvailable to false.`);

                try {
                    await Driver.findByIdAndUpdate(driverId, { isAvailable: false });
                    socketDriverMap.delete(socket.id);
                    // Optionally emit an event to admin to remove from list immediately
                    // io.emit('driverOffline', { driverId }); 
                } catch (error) {
                    console.error('Error updating driver availability on disconnect:', error);
                }
            }
        });
    });
}
