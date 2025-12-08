import api from './api';

export const restaurantService = {
    getProfile: async () => {
        const response = await api.get('/restaurant/profile');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.put('/restaurant/profile', data);
        return response.data;
    },

    toggleOperatingStatus: async (isOperating) => {
        const response = await api.put('/restaurant/operating-status', { isOperating });
        return response.data;
    },

    getMenu: async () => {
        const response = await api.get('/restaurant/menu');
        return response.data;
    },

    addMenuItem: async (item) => {
        const response = await api.post('/restaurant/menu', item);
        return response.data;
    },

    updateMenuItem: async (itemId, item) => {
        const response = await api.put(`/restaurant/menu/${itemId}`, item);
        return response.data;
    },

    deleteMenuItem: async (itemId) => {
        const response = await api.delete(`/restaurant/menu/${itemId}`);
        return response.data;
    },

    getOrders: async () => {
        const response = await api.get('/restaurant/orders');
        return response.data;
    },

    getPendingOrders: async () => {
        const response = await api.get('/restaurant/orders/pending');
        return response.data;
    },

    acceptOrder: async (orderId, estimatedPrepTime) => {
        const response = await api.put(`/restaurant/orders/${orderId}/accept`, { estimatedPrepTime });
        return response.data;
    },

    rejectOrder: async (orderId, reason) => {
        const response = await api.put(`/restaurant/orders/${orderId}/reject`, { reason });
        return response.data;
    },

    updateOrderStatus: async (orderId, status) => {
        const response = await api.put(`/restaurant/orders/${orderId}/status`, { status });
        return response.data;
    },

    getAnalytics: async () => {
        const response = await api.get('/restaurant/analytics');
        return response.data;
    }
};
