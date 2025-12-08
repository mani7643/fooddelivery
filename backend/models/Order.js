import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    // Unique identifier (Mongo will generate _id)
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null,
    },
    items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 },
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
        },
    },
    dropoffLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
        },
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'pickedUp', 'enRoute', 'delivered', 'cancelled'],
        default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Index for geospatial queries on pickup location
orderSchema.index({ pickupLocation: '2dsphere' });

export default mongoose.model('Order', orderSchema);
