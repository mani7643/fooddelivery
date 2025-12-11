import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { driverService } from '../../services/driverService';
import Navbar from '../../components/Navbar';
import StatsCard from '../../components/StatsCard';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DriverDashboard() {
    const { socket } = useSocket();
    const [driver, setDriver] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false); // Added isAvailable state

    // Function to load initial data (driver profile and active orders)
    const loadData = async () => {
        setLoading(true);
        try {
            const profileData = await driverService.getDriverProfile();
            const ordersData = await driverService.getActiveOrders();
            setDriver(profileData.driver);
            setIsAvailable(profileData.driver.isAvailable);
            setActiveOrders(ordersData.orders);
        } catch (error) {
            console.error('Error loading data:', error);
            // Optionally, handle error display to user
        } finally {
            setLoading(false);
        }
    };

    // Function to specifically load active orders (used after actions like accept/update)
    const loadActiveOrders = async () => {
        try {
            const data = await driverService.getActiveOrders();
            setActiveOrders(data.orders);
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    };

    // Toggle driver availability
    const toggleAvailability = async () => {
        try {
            const newStatus = !isAvailable;
            await driverService.toggleAvailability(newStatus);
            setIsAvailable(newStatus);
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    // Handle accepting an order
    const handleAcceptOrder = async (orderId) => {
        try {
            await driverService.acceptOrder(orderId);
            loadActiveOrders(); // Reload active orders to reflect changes
        } catch (error) {
            console.error('Error accepting order:', error);
        }
    };

    // Handle updating order status
    const handleUpdateStatus = async (orderId, status) => {
        try {
            await driverService.updateOrderStatus(orderId, status);
            loadActiveOrders(); // Reload active orders
            loadData(); // Reload driver data to update earnings
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Geolocation tracking
    useEffect(() => {
        let watchId;

        if (socket && driver && isAvailable) {
            if ('geolocation' in navigator) {
                console.log('Starting geolocation tracking...');
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('Browser GPS Update:', latitude, longitude);

                        // Emit location update to server (Send GeoJSON to match Admin expectations)
                        socket.emit('updateLocation', {
                            driverId: driver._id,
                            location: {
                                type: 'Point',
                                coordinates: [longitude, latitude]
                            }
                        });

                        // Also persist to DB via API
                        driverService.updateLocation(latitude, longitude).catch(err =>
                            console.error('Error persisting location:', err)
                        );
                    },
                    (error) => {
                        console.error('Geolocation error:', error.message);
                        alert('GPS Error: ' + error.message);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 5000
                    }
                );
            } else {
                console.warn('Geolocation is not supported by this browser.');
                alert('Geolocation not supported');
            }
        }

        return () => {
            if (watchId) {
                console.log('Stopping geolocation tracking...');
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [socket, driver, isAvailable]);

    useEffect(() => {
        loadData();

        if (socket) {
            // Listen for new orders assigned to this driver
            socket.on('newOrder', (order) => {
                console.log('New order received:', order);
                // Optionally, show a notification or automatically add to active orders
                loadActiveOrders(); // Reload active orders to fetch the new one
            });

            // Listen for updates to orders (e.g., customer cancellation)
            socket.on('orderUpdated', (updatedOrder) => {
                console.log('Order updated:', updatedOrder);
                // If an order is cancelled or completed by another means, refresh
                loadActiveOrders();
                loadData(); // In case earnings or other driver stats are affected
            });
        }

        return () => {
            if (socket) {
                socket.off('newOrder');
                socket.off('orderUpdated');
            }
        };
    }, [socket]); // Depend on socket to re-establish listeners if it changes

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Navbar />
            <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 className="text-3xl font-bold" style={{ marginBottom: 'var(--space-2)' }}>
                        Driver Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Welcome back! Manage your deliveries and track your earnings.
                    </p>
                </div>

                {/* Availability Toggle */}
                <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                            Availability Status
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            {isAvailable ? 'You are currently available for deliveries' : 'You are currently offline'}
                        </p>
                    </div>
                    <button
                        onClick={toggleAvailability}
                        className={`btn ${isAvailable ? 'btn-danger' : 'btn-success'}`}
                        style={{ padding: 'var(--space-3) var(--space-6)' }}
                    >
                        {isAvailable ? '🔴 Go Offline' : '🟢 Go Online'}
                    </button>
                </div>

                {/* DEBUG: Manual Location Trigger */}
                <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '20px', border: '1px dashed #0ea5e9' }}>
                    <p style={{ fontSize: '12px', marginBottom: '5px', color: '#0369a1' }}>🔧 Debug Controls (Use if live tracking fails)</p>
                    <button
                        onClick={() => {
                            if (!driver || !driver._id) {
                                alert('Driver profile not loaded yet');
                                return;
                            }
                            console.log('Manual location trigger clicked');
                            // Fake location increment to see movement
                            const lat = 20.5937 + (Math.random() * 0.01);
                            const lng = 78.9629 + (Math.random() * 0.01);

                            // 1. Socket Emit
                            socket.emit('updateLocation', {
                                driverId: driver._id,
                                location: { type: 'Point', coordinates: [lng, lat] }
                            });
                            console.log('Emitted manual socket update');

                            // 2. API Call
                            driverService.updateLocation(lat, lng)
                                .then(res => alert('Location sent to server! Check Admin Dashboard.'))
                                .catch(err => alert('Error sending location: ' + err.message));
                        }}
                        className="btn"
                        style={{ backgroundColor: '#0ea5e9', color: 'white', fontSize: '12px', padding: '5px 10px' }}
                    >
                        📍 Force Send Test Location
                    </button>
                    <p style={{ fontSize: '10px', marginTop: '5px', color: '#666' }}>Browser Geolocation Status: {navigator.geolocation ? 'Supported' : 'Not Supported'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-8)' }}>
                    <StatsCard
                        icon="💰"
                        label="Today's Earnings"
                        value={`₹${driver?.todayEarnings || 0}`}
                        color="success"
                    />
                    <StatsCard
                        icon="📦"
                        label="Total Deliveries"
                        value={driver?.totalDeliveries || 0}
                        color="primary"
                    />
                    <StatsCard
                        icon="⭐"
                        label="Rating"
                        value={driver?.rating?.toFixed(1) || '0.0'}
                        color="warning"
                    />
                    <StatsCard
                        icon="💵"
                        label="Total Earnings"
                        value={`₹${driver?.totalEarnings || 0}`}
                        color="purple"
                    />
                </div>

                {/* Active Orders */}
                <div>
                    <h2 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-4)' }}>
                        Active Deliveries
                    </h2>
                    {activeOrders.length === 0 ? (
                        <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📭</div>
                            <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
                                No Active Deliveries
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {isAvailable ? 'Waiting for new delivery requests...' : 'Go online to start receiving orders'}
                            </p>
                        </div>
                    ) : (
                        activeOrders.map((order) => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onAccept={handleAcceptOrder}
                                onUpdateStatus={handleUpdateStatus}
                                userRole="driver"
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
