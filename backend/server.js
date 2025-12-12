import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import documentRoutes from './routes/documentRoutes.js'; // Added document routes

// Import socket handler
import socketHandler from './socket/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Define allowed CORS origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://18.60.109.68:5173',
    'http://manindra-devops.s3-website.ap-south-2.amazonaws.com',
    'https://d2oivjm33gyjn0.cloudfront.net',
    process.env.FRONTEND_URL
].filter(Boolean);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Global Request Logger - Debugging CloudFront/Uploads
export let lastGlobalRequest = null;
app.use((req, res, next) => {
    console.log(`🌍 [Global Log] ${req.method} ${req.url}`);
    lastGlobalRequest = {
        method: req.method,
        url: req.url,
        time: new Date().toISOString(),
        headers: req.headers
    };
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoUri) {
    console.error('❌ FATAL: No MongoDB URI provided!');
    console.error('Please set MONGO_URI or MONGODB_URI environment variable');
    process.exit(1);
}

console.log('🔌 Connecting to MongoDB...');
console.log('Using URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//*****:*****@'));

mongoose.connect(mongoUri)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log('📊 Database:', mongoose.connection.name);
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('Full error:', err);
        process.exit(1);
    });

// Socket.io handler
socketHandler(io);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/documents', documentRoutes); // Register document routes

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Food Delivery Partner Platform API',
        version: '1.0.1-debug',
        endpoints: {
            auth: '/api/auth',
            driver: '/api/driver',
            orders: '/api/orders',
            documents: '/api/documents'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io server ready`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
