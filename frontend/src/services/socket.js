import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL.replace('/api', '');

let socket;

export const initiateSocketConnection = (token) => {
    socket = io(SOCKET_URL, {
        auth: {
            token
        },
    });
    console.log('Connecting to socket...');
};

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
};

export const subscribeToDriverUpdates = (cb) => {
    if (!socket) return;
    socket.on('driverLocationUpdate', (data) => {
        console.log('Driver location update received:', data);
        cb(null, data);
    });
};

export const joinAdminRoom = (userId) => {
    if (socket && userId) {
        socket.emit('join', { userId, role: 'admin' });
    }
}

export const getSocket = () => socket;
