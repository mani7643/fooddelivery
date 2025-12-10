import axios from 'axios';

const api = axios.create({
    // Use localhost in Dev mode, otherwise use Env variable (from CI/CD or .env)
    baseURL: import.meta.env.DEV ? 'http://localhost:8000/api' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api'),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Debug: Log the actual baseURL being used
console.log('🔧 [API Config] VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('🔧 [API Config] Final baseURL:', api.defaults.baseURL);

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
