import express from 'express';
import Order from '../models/Order.js';
import Driver from '../models/Driver.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/orders/available - list pending orders for driver (simple version returns all pending)
router.get('/available', protect, authorize('driver'), async (req, res) => {
    try {
        const pendingOrders = await Order.find({ status: 'pending' }).select('-__v');
        res.json({ success: true, orders: pendingOrders });
    } catch (err) {
        console.error('Error fetching available orders:', err);
        res.status(500).json({ message: 'Server error fetching orders' });
    }
});

// POST /api/orders/:id/accept - driver accepts an order
router.post('/:id/accept', protect, authorize('driver'), async (req, res) => {
    const driverId = req.user._id;
    const { id } = req.params;
    try {
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'pending') return res.status(400).json({ message: 'Order cannot be accepted' });

        order.driverId = driverId;
        order.status = 'accepted';
        await order.save();

        // Update driver availability
        await Driver.findByIdAndUpdate(driverId, { isAvailable: false, currentStatus: 'active' });

        // Notify via socket (if needed)
        const io = req.app.get('io');
        if (io) {
            io.emit('orderStatusUpdate', { orderId: order._id, status: order.status });
        }

        res.json({ success: true, order });
    } catch (err) {
        console.error('Error accepting order:', err);
        res.status(500).json({ message: 'Server error accepting order' });
    }
});

// PATCH /api/orders/:id/status - driver updates order status (pickedUp, enRoute, delivered, cancelled)
router.patch('/:id/status', protect, authorize('driver'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // expected one of the allowed statuses
    const allowed = ['pickedUp', 'enRoute', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }
    try {
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (String(order.driverId) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this order' });
        }
        order.status = status;
        await order.save();

        // If delivered, mark driver as available again
        if (status === 'delivered') {
            await Driver.findByIdAndUpdate(req.user._id, { isAvailable: true, currentStatus: 'idle' });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('orderStatusUpdate', { orderId: order._id, status: order.status });
        }

        res.json({ success: true, order });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ message: 'Server error updating status' });
    }
});

export default router;
