import api from './api';

export const driverService = {
    getProfile: async () => {
        const response = await api.get('/driver/profile');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.put('/driver/profile', data);
        return response.data;
    },

    updateLocation: async ({ latitude, longitude }) => {
        const response = await api.put('/driver/location', { latitude, longitude });
        return response.data;
    },

    toggleAvailability: async (isAvailable) => {
        const response = await api.put('/driver/availability', { isAvailable });
        return response.data;
    },

    getOrders: async () => {
        const response = await api.get('/driver/orders');
        return response.data;
    },

    getActiveOrders: async () => {
        const response = await api.get('/driver/orders/active');
        return response.data;
    },

    acceptOrder: async (orderId) => {
        const response = await api.put(`/driver/orders/${orderId}/accept`);
        return response.data;
    },

    updateOrderStatus: async (orderId, status) => {
        const response = await api.put(`/driver/orders/${orderId}/status`, { status });
        return response.data;
    },

    getEarnings: async () => {
        const response = await api.get('/driver/earnings');
        return response.data;
    }
};
