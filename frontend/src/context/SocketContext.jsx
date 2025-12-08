import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { authService } from '../services/authService';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const user = authService.getStoredUser();
        // If we want to allow guests or non-auth socket usage, we might modify this.
        // But for driver apps, usually we need auth.
        // Fallback: if no user, maybe we don't connect or connect anonymously?
        // For now, let's connect if we have a socket URL, regardless of user, 
        // OR rely on the previous logic.

        // Actually, the previous "Good" version had:
        /*
        const user = authService.getStoredUser();
        if (!user) return;
        */
        // Let's stick to that for now AND add a way to connect if user logs in later?
        // The previous code used useEffect([]) which only runs once. 
        // If user logs in *after* mount, this won't trigger. 
        // We really should depend on `user` or listen to auth changes.
        // But let's restore the EXACT previous "Good" version first to minimize variables, 
        // then fix the "login after load" issue if it exists.

        if (!user) return;

        // Connect to Socket.io server
        const newSocket = io('http://localhost:8000', { // Ensure port 8000 matches backend
            transports: ['websocket'],
            reconnection: true
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);

            // Join user-specific room
            newSocket.emit('join', {
                userId: user.id,
                role: user.role
            });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const value = {
        socket,
        connected
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
