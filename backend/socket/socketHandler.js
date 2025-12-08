export default function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join room based on user role and ID
        socket.on('join', (data) => {
            const { userId, role } = data;
            socket.join(`${role}_${userId}`);
            console.log(`User ${userId} joined as ${role}`);
        });

        // Driver location update
        socket.on('updateLocation', (data) => {
            const { driverId, location } = data;
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
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
}
