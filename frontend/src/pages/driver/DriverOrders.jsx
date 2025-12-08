import { useState, useEffect } from 'react';
import { driverService } from '../../services/driverService';
import Navbar from '../../components/Navbar';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DriverOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await driverService.getOrders();
            setOrders(data.orders);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try {
            await driverService.updateOrderStatus(orderId, status);
            loadOrders();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['picked', 'ready'].includes(order.status);
        if (filter === 'completed') return order.status === 'delivered';
        return true;
    });

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Navbar />
            <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: 'var(--space-4)' }}>
                        My Orders
                    </h1>

                    {/* Filter Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <button
                            onClick={() => setFilter('all')}
                            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            All Orders
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            Completed
                        </button>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📦</div>
                        <h3 style={{ fontSize: 'var(--font-size-xl)' }}>No Orders Found</h3>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order._id}
                            order={order}
                            onUpdateStatus={handleUpdateStatus}
                            userRole="driver"
                        />
                    ))
                )}
            </div>
        </div>
    );
}
