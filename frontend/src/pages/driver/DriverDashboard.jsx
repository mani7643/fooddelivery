import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { driverService } from '../../services/driverService';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import StatsCard from '../../components/StatsCard';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DriverDashboard() {
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [driver, setDriver] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false); // Added isAvailable state

    // Function to load initial data (driver profile and active orders)
    const loadData = async () => {
        setLoading(true);
        try {
            const profileData = await driverService.getDriverProfile();

            // Check verification status and redirect if needed
            if (profileData.driver.verificationStatus === 'pending_documents') {
                navigate('/driver/upload-documents');
                return;
            }
            if (profileData.driver.verificationStatus !== 'verified') {
                navigate('/driver/verification-pending');
                return;
            }

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

    const [geoStatus, setGeoStatus] = useState('idle'); // idle, requesting, active, error, denied
    const [geoError, setGeoError] = useState('');

    // Helper to process location updates
    const processLocationUpdate = (latitude, longitude) => {
        setGeoStatus('active');
        setGeoError('');

        if (socket && driver) {
            socket.emit('updateLocation', {
                driverId: driver._id,
                location: { latitude, longitude }
            });
        }

        driverService.updateLocation({ latitude, longitude }).catch(err =>
            console.error('Error persisting location:', err)
        );
    };

    // Geolocation tracking
    useEffect(() => {
        let watchId;

        if (socket && driver && isAvailable) {
            if ('geolocation' in navigator) {
                console.log('Starting geolocation tracking...');
                setGeoStatus('requesting');

                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        processLocationUpdate(position.coords.latitude, position.coords.longitude);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        setGeoStatus('error');
                        if (error.code === 1) setGeoStatus('denied');
                        setGeoError(error.message || 'Location retrieval failed.');
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 30000,
                        maximumAge: 10000
                    }
                );
            } else {
                setGeoStatus('error');
                setGeoError('Geolocation is not supported by this browser.');
            }
        } else {
            setGeoStatus('idle');
        }

        return () => {
            if (watchId) {
                console.log('Stopping geolocation tracking...');
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [socket, driver, isAvailable]);

    const handleManualLocationParams = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported');
            return;
        }
        setGeoStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                alert('Location updated successfully!');
                processLocationUpdate(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                setGeoStatus('error');
                setGeoError(err.message);
                alert(`Error: ${err.message}`);
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    };

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
                <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                                Availability Status
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                {isAvailable
                                    ? 'You are currently available. Location tracking is active.'
                                    : 'Go Online to enable location tracking and receive orders'}
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

                    {/* Geolocation Status Bar */}
                    {isAvailable && (
                        <div style={{
                            padding: '10px',
                            borderRadius: '8px',
                            background: geoStatus === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${geoStatus === 'active' ? '#10b981' : '#ef4444'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.2rem' }}>
                                    {geoStatus === 'active' ? '📡' : geoStatus === 'requesting' ? '⏳' : '⚠️'}
                                </span>
                                <div>
                                    <p style={{ fontWeight: 'bold', color: geoStatus === 'active' ? '#10b981' : '#ef4444' }}>
                                        {geoStatus === 'active' ? 'Live Tracking Active' : geoStatus === 'requesting' ? 'Requesting Location...' : 'Location Error'}
                                    </p>
                                    {geoError && <p style={{ fontSize: '0.8rem', color: '#ef4444' }}>{geoError}</p>}
                                </div>
                            </div>

                            {geoStatus !== 'active' && geoStatus !== 'requesting' && (
                                <button
                                    onClick={handleManualLocationParams}
                                    style={{
                                        padding: '4px 8px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Enable GPS
                                </button>
                            )}
                        </div>
                    )}
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
