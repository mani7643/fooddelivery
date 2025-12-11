import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useSocket } from '../../context/SocketContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issues in React Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIconRetina,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function AdminVerifications() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { socket } = useSocket();
    const [viewMode, setViewMode] = useState('verifications'); // 'verifications', 'verified', 'rejected', 'admins', 'online'

    // Helper to handle both local uploads and S3 URLs
    const getDocumentUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
    };

    const [drivers, setDrivers] = useState([]);
    const [onlineDrivers, setOnlineDrivers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [notes, setNotes] = useState('');

    // Phase 2 State
    const [stats, setStats] = useState({
        totalDrivers: 0,
        pendingVerification: 0,
        verifiedDrivers: 0,
        rejectedDrivers: 0,
        totalUsers: 0
    });
    const [searchQuery, setSearchQuery] = useState('');

    const handleViewDocument = async (fileUrl) => {
        if (!fileUrl) return;

        // If it's already a full signed URL or external URL (rare), just open it
        // Or if it's a local file URL logic
        if (!fileUrl.startsWith('http')) {
            // Local file, use existing logic inside getDocumentUrl but we can just construct it here
            const localUrl = `${import.meta.env.VITE_API_URL.replace('/api', '')}${fileUrl}`;
            window.open(localUrl, '_blank');
            return;
        }

        // It is an S3 URL (starts with http). We need a signed URL.
        try {
            const res = await api.post('/documents/sign-url', { fileUrl });
            if (res.data.signedUrl) {
                window.open(res.data.signedUrl, '_blank');
            } else {
                alert('Could not generate secure link');
            }
        } catch (err) {
            console.error('Error signing URL', err);
            // Fallback: try opening directly just in case (will likely fail if private)
            window.open(fileUrl, '_blank');
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (viewMode === 'verifications') {
            fetchPendingDrivers();
        } else if (viewMode === 'verified') {
            fetchVerifiedDrivers();
        } else if (viewMode === 'rejected') {
            fetchRejectedDrivers();
        } else if (viewMode === 'online') {
            fetchOnlineDrivers();
        } else {
            fetchPendingAdmins();
        }
    }, [viewMode, searchQuery]); // Re-fetch when viewMode or searchQuery changes

    // Socket Listener for Real-time Location Updates
    useEffect(() => {
        if (socket && viewMode === 'online') {
            console.log('Listening for driver location updates...');

            socket.on('driverLocationUpdate', (data) => {
                const { driverId, location } = data;
                setOnlineDrivers(prev => {
                    // Check if driver exists in list
                    const exists = prev.find(d => d._id === driverId);
                    if (exists) {
                        // Update location
                        return prev.map(d =>
                            d._id === driverId
                                ? { ...d, currentLocation: { ...d.currentLocation, coordinates: [location.longitude, location.latitude] } }
                                : d
                        );
                    } else {
                        // Optionally fetch full driver details if new, or ignore until refresh
                        // For now, we prefer not to add incomplete driver objects
                        return prev;
                    }
                });
            });

            return () => {
                socket.off('driverLocationUpdate');
            };
        }
    }, [socket, viewMode]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchPendingDrivers = async () => {
        setLoading(true);
        try {
            const url = searchQuery ? `/admin/drivers?status=pending_verification&search=${searchQuery}` : '/admin/pending-verifications';
            const response = await api.get(url);
            setDrivers(response.data.drivers || []);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVerifiedDrivers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/drivers?status=verified&search=${searchQuery}`);
            setDrivers(response.data.drivers || []);
        } catch (error) {
            console.error('Error fetching verified drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRejectedDrivers = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/drivers?status=rejected&search=${searchQuery}`);
            setDrivers(response.data.drivers || []);
        } catch (error) {
            console.error('Error fetching rejected drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOnlineDrivers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/online-drivers');
            setOnlineDrivers(response.data.drivers || []);
        } catch (error) {
            console.error('Error fetching online drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingAdmins = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/pending-admins');
            setAdmins(response.data.admins || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDriver = (driver) => {
        setSelectedDriver(driver);
        setShowModal(true);
        setNotes('');
    };

    const handleApproveAdmin = async (adminId) => {
        if (!window.confirm('Are you sure you want to approve this admin account?')) return;

        setActionLoading(true);
        try {
            await api.put(`/admin/approve-admin/${adminId}`);
            setAdmins(admins.filter(a => a._id !== adminId));
            alert('Admin account approved successfully');
        } catch (error) {
            alert('Error approving admin: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedDriver) return;

        setActionLoading(true);
        try {
            await api.put(`/admin/verify-driver/${selectedDriver._id}`, {
                status: 'verified',
                notes: notes || 'All documents verified'
            });

            // Remove from list
            setDrivers(drivers.filter(d => d._id !== selectedDriver._id));
            setShowModal(false);
            setSelectedDriver(null);
            alert('Driver approved successfully! Email sent.');
            fetchStats();
        } catch (error) {
            alert('Error approving driver: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedDriver) return;
        if (!notes.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setActionLoading(true);
        try {
            await api.put(`/admin/verify-driver/${selectedDriver._id}`, {
                status: 'rejected',
                notes: notes
            });

            // Remove from list
            setDrivers(drivers.filter(d => d._id !== selectedDriver._id));
            setShowModal(false);
            setSelectedDriver(null);
            alert('Driver rejected.');
            fetchStats();
        } catch (error) {
            alert('Error rejecting driver: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReconsider = async () => {
        if (!selectedDriver) return;

        setActionLoading(true);
        try {
            // Reset to pending
            await api.put(`/admin/verify-driver/${selectedDriver._id}`, {
                status: 'pending_verification',
                notes: notes || 'Reconsidered by admin'
            });

            // Remove from list
            setDrivers(drivers.filter(d => d._id !== selectedDriver._id));
            setShowModal(false);
            setSelectedDriver(null);
            alert('Driver status reset to Pending Verification.');
            fetchStats(); // Update stats
        } catch (error) {
            alert('Error resetting driver: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            // Direct cleanup to avoid any context/state issues
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force hard navigation
            window.location.assign('/login');
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-6)', background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    marginBottom: 'var(--space-8)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    position: 'relative', // Ensure context for z-index
                    zIndex: 20
                }}>
                    <div>
                        <h1 className="text-4xl font-bold" style={{
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: 'var(--space-2)'
                        }}>
                            Admin Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                            Manage verify requests and admin approvals
                        </p>
                    </div>

                    <button
                        type="button" // Explicit type
                        onClick={handleLogout}
                        className="btn"
                        style={{
                            background: 'var(--surface-raised)',
                            color: 'var(--danger-400)',
                            border: '1px solid var(--border-color)',
                            padding: 'var(--space-3) var(--space-6)',
                            fontWeight: 'var(--font-weight-medium)',
                            boxShadow: 'var(--shadow-sm)',
                            cursor: 'pointer',
                            position: 'relative', // Bring to front
                            zIndex: 50 // Ensure clickable
                        }}
                    >
                        Sign Out
                    </button>
                </div>

                {/* Stats Bar */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-6)'
                }}>
                    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Drivers</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalDrivers}</p>
                    </div>
                    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ color: 'var(--warning-400)', fontSize: '0.9rem' }}>Pending</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.pendingVerification}</p>
                    </div>
                    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ color: 'var(--success-400)', fontSize: '0.9rem' }}>Verified</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.verifiedDrivers}</p>
                    </div>
                    <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ color: 'var(--danger-400)', fontSize: '0.9rem' }}>Rejected</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.rejectedDrivers}</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="glass" style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)'
                }}>
                    <input
                        type="text"
                        placeholder="Search drivers by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1,
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-secondary)',
                    padding: 'var(--space-1)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-6)',
                    width: 'fit-content'
                }}>
                    <button
                        onClick={() => setViewMode('verifications')}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: viewMode === 'verifications' ? 'var(--surface-raised)' : 'transparent',
                            color: viewMode === 'verifications' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: 'var(--font-weight-medium)',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: 'var(--space-2)'
                        }}
                    >
                        Pending Drivers
                        {drivers.length > 0 && viewMode === 'verifications' && (
                            <span style={{
                                background: 'var(--primary-500)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '0.75rem'
                            }}>{drivers.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setViewMode('verified')}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: viewMode === 'verified' ? 'var(--surface-raised)' : 'transparent',
                            color: viewMode === 'verified' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: 'var(--font-weight-medium)',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: 'var(--space-2)'
                        }}
                    >
                        Verified Drivers
                    </button>
                    <button
                        onClick={() => setViewMode('rejected')}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: viewMode === 'rejected' ? 'var(--surface-raised)' : 'transparent',
                            color: viewMode === 'rejected' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: 'var(--font-weight-medium)',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: 'var(--space-2)'
                        }}
                    >
                        Rejected Drivers
                    </button>
                    <button
                        onClick={() => setViewMode('online')}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: viewMode === 'online' ? 'var(--surface-raised)' : 'transparent',
                            color: viewMode === 'online' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: 'var(--font-weight-medium)',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: 'var(--space-2)',
                            alignItems: 'center'
                        }}
                    >
                        Online Drivers
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#10b981',
                            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                        }}></span>
                    </button>
                    <button
                        onClick={() => setViewMode('admins')}
                        style={{
                            padding: 'var(--space-3) var(--space-6)',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: viewMode === 'admins' ? 'var(--surface-raised)' : 'transparent',
                            color: viewMode === 'admins' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            fontWeight: 'var(--font-weight-medium)',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: 'var(--space-2)'
                        }}
                    >
                        Pending Admins
                        {admins.length > 0 && (
                            <span style={{
                                background: 'var(--warning-500)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '0.75rem'
                            }}>{admins.length}</span>
                        )}
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                        <div className="animate-spin" style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid var(--bg-tertiary)',
                            borderTop: '4px solid var(--primary-500)',
                            borderRadius: '50%'
                        }}></div>
                    </div>
                ) : (
                    <>
                        {/* DRIVER VERIFICATIONS LIST & VERIFIED LIST & REJECTED LIST */}
                        {(viewMode === 'verifications' || viewMode === 'verified' || viewMode === 'rejected') && (
                            drivers.length === 0 ? (
                                <div className="glass" style={{
                                    padding: 'var(--space-12)',
                                    borderRadius: 'var(--radius-2xl)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)' }}>
                                        {viewMode === 'verifications' ? '✅' : viewMode === 'verified' ? '📂' : '🚫'}
                                    </div>
                                    <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
                                        {viewMode === 'verifications' ? 'All Drivers Verified!' : viewMode === 'verified' ? 'No Verified Drivers Found' : 'No Rejected Drivers'}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {viewMode === 'verifications' ? 'No pending driver verifications at the moment.' : viewMode === 'verified' ? 'No drivers have been verified yet.' : 'No drivers currently rejected.'}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                                    {drivers.map((driver) => (
                                        <div
                                            key={driver._id}
                                            className="glass"
                                            style={{
                                                padding: 'var(--space-6)',
                                                borderRadius: 'var(--radius-xl)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <h3 style={{
                                                    fontSize: 'var(--font-size-lg)',
                                                    fontWeight: 'var(--font-weight-semibold)',
                                                    marginBottom: 'var(--space-2)'
                                                }}>
                                                    {driver.userId?.name || driver.name}
                                                    {viewMode === 'verified' && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'green' }}>✓ Verified</span>}
                                                    {viewMode === 'rejected' && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'red' }}>✗ Rejected</span>}
                                                </h3>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                                    <p>📧 {driver.userId?.email}</p>
                                                    <p>📱 {driver.userId?.phone || driver.phone}</p>
                                                    <p>🚗 {driver.vehicleType} - {driver.vehicleNumber}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleViewDriver(driver)}
                                                className="btn btn-primary"
                                                style={{ padding: 'var(--space-3) var(--space-6)' }}
                                            >
                                                {viewMode === 'verified' || viewMode === 'rejected' ? 'View/Edit' : 'Review Documents'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {/* ONLINE DRIVERS MAP */}
                        {viewMode === 'online' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--space-6)', height: '600px' }}>
                                {/* Sidebar List */}
                                <div className="glass" style={{
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-lg)',
                                    overflowY: 'auto',
                                    height: '100%'
                                }}>
                                    <h3 style={{
                                        padding: '0 var(--space-2) var(--space-4)',
                                        borderBottom: '1px solid var(--border-color)',
                                        marginBottom: 'var(--space-4)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>Active Drivers ({onlineDrivers.length})</span>
                                        {/* Simulate Move button for testing */}
                                        <button
                                            onClick={() => {
                                                // Only for demo/testing purposes
                                                setOnlineDrivers(prev => prev.map(d => {
                                                    const [lng, lat] = d.currentLocation.coordinates;
                                                    // Check if near 0,0 (Ocean) or invalid
                                                    const isZero = !lat || !lng || (Math.abs(lat) < 1 && Math.abs(lng) < 1);

                                                    // If zero, jump to Hyderabad, India. Else add noise.
                                                    const newLng = isZero ? 78.9629 : lng + (Math.random() - 0.5) * 0.01;
                                                    const newLat = isZero ? 20.5937 : lat + (Math.random() - 0.5) * 0.01;

                                                    return {
                                                        ...d,
                                                        currentLocation: {
                                                            coordinates: [newLng, newLat]
                                                        }
                                                    };
                                                }));
                                            }}
                                            style={{ fontSize: '0.7rem', padding: '2px 6px', opacity: 0.5 }}
                                        >
                                            Simulate Move
                                        </button>
                                    </h3>

                                    {onlineDrivers.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>😴</div>
                                            <p>No drivers online</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                            {onlineDrivers.map(driver => (
                                                <div
                                                    key={driver._id}
                                                    style={{
                                                        padding: 'var(--space-3)',
                                                        background: 'var(--bg-secondary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        cursor: 'pointer',
                                                        border: selectedDriver?._id === driver._id ? '1px solid var(--primary-500)' : '1px solid transparent'
                                                    }}
                                                    onClick={() => setSelectedDriver(driver)}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>{driver.userId.name}</span>
                                                        <span style={{ fontSize: '0.8rem', color: '#10b981' }}>● Online</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {driver.vehicleType} • {driver.vehicleNumber}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Map */}
                                <div className="glass" style={{
                                    borderRadius: 'var(--radius-lg)',
                                    overflow: 'hidden',
                                    height: '100%',
                                    zIndex: 0 // Ensure map stays below modals/headers if necessary
                                }}>
                                    <MapContainer
                                        center={[20.5937, 78.9629]} // Default center (India)
                                        zoom={5}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        {onlineDrivers.map(driver => (
                                            driver.currentLocation?.coordinates && (
                                                <Marker
                                                    key={driver._id}
                                                    position={[
                                                        driver.currentLocation.coordinates[1], // Latitude (Index 1 in GeoJSON)
                                                        driver.currentLocation.coordinates[0]  // Longitude (Index 0 in GeoJSON)
                                                    ]}
                                                >
                                                    <Popup>
                                                        <div style={{ minWidth: '150px' }}>
                                                            <h4 style={{ fontWeight: 'bold', marginBottom: '5px' }}>{driver.userId.name}</h4>
                                                            <p style={{ margin: '2px 0' }}>Phone: {driver.userId.phone}</p>
                                                            <p style={{ margin: '2px 0' }}>Vehicle: {driver.vehicleNumber}</p>
                                                            <p style={{ margin: '2px 0', color: '#10b981' }}>Status: {driver.currentStatus}</p>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            )
                                        ))}
                                    </MapContainer>
                                </div>
                            </div>
                        )}

                        {/* PENDING ADMINS LIST */}
                        {viewMode === 'admins' && (
                            admins.length === 0 ? (
                                <div className="glass" style={{
                                    padding: 'var(--space-12)',
                                    borderRadius: 'var(--radius-2xl)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)' }}>🛡️</div>
                                    <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
                                        No Pending Admins
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        All admin accounts are active.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                                    {admins.map((admin) => (
                                        <div
                                            key={admin._id}
                                            className="glass"
                                            style={{
                                                padding: 'var(--space-6)',
                                                borderRadius: 'var(--radius-xl)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <h3 style={{
                                                    fontSize: 'var(--font-size-lg)',
                                                    fontWeight: 'var(--font-weight-semibold)',
                                                    marginBottom: 'var(--space-2)'
                                                }}>
                                                    {admin.name}
                                                </h3>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                                    <p>📧 {admin.email}</p>
                                                    <p>📱 {admin.phone}</p>
                                                    <p style={{ marginTop: '4px' }}>
                                                        <span style={{
                                                            background: 'rgba(234, 179, 8, 0.2)',
                                                            color: 'var(--warning-400)',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem'
                                                        }}>Pending Approval</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleApproveAdmin(admin._id)}
                                                disabled={actionLoading}
                                                style={{
                                                    padding: 'var(--space-3) var(--space-6)',
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 'var(--radius-lg)',
                                                    fontWeight: 'var(--font-weight-semibold)',
                                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                    opacity: actionLoading ? 0.6 : 1
                                                }}
                                            >
                                                {actionLoading ? 'Approving...' : '✓ Approve Access'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}

                {/* Modal for Drivers (Existing) */}
                {showModal && selectedDriver && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 'var(--space-4)'
                    }}>
                        <div className="glass" style={{
                            maxWidth: '800px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            padding: 'var(--space-8)',
                            borderRadius: 'var(--radius-2xl)'
                        }}>
                            <h2 style={{
                                fontSize: 'var(--font-size-2xl)',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: 'var(--space-6)'
                            }}>
                                {selectedDriver.userId?.name || selectedDriver.name}
                            </h2>

                            {/* Driver Info */}
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>
                                    Driver Information
                                </h3>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    <p>Email: {selectedDriver.userId?.email}</p>
                                    <p>Phone: {selectedDriver.userId?.phone || selectedDriver.phone}</p>
                                    <p>Vehicle: {selectedDriver.vehicleType} - {selectedDriver.vehicleNumber}</p>
                                    <p>License: {selectedDriver.licenseNumber}</p>
                                </div>
                            </div>

                            {/* Documents */}
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>
                                    Uploaded Documents
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                                    {selectedDriver.documents?.aadhaarFront && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>Aadhaar Front</p>
                                            <img
                                                src={getDocumentUrl(selectedDriver.documents.aadhaarFront)}
                                                alt="Aadhaar Front"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => handleViewDocument(selectedDriver.documents.aadhaarFront)}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.aadhaarBack && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>Aadhaar Back</p>
                                            <img
                                                src={getDocumentUrl(selectedDriver.documents.aadhaarBack)}
                                                alt="Aadhaar Back"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => handleViewDocument(selectedDriver.documents.aadhaarBack)}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.dlFront && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>DL Front</p>
                                            <img
                                                src={getDocumentUrl(selectedDriver.documents.dlFront)}
                                                alt="DL Front"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => handleViewDocument(selectedDriver.documents.dlFront)}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.dlBack && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>DL Back</p>
                                            <img
                                                src={getDocumentUrl(selectedDriver.documents.dlBack)}
                                                alt="DL Back"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => handleViewDocument(selectedDriver.documents.dlBack)}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.panCard && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>PAN Card</p>
                                            <img
                                                src={getDocumentUrl(selectedDriver.documents.panCard)}
                                                alt="PAN Card"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => handleViewDocument(selectedDriver.documents.panCard)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-2)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-medium)'
                                }}>
                                    Notes (optional for approval, required for rejection)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input"
                                    rows={3}
                                    placeholder="Add any notes or reasons..."
                                    style={{ width: '100%', resize: 'vertical' }}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                                {selectedDriver.verificationStatus !== 'verified' && selectedDriver.verificationStatus !== 'rejected' && (
                                    <>
                                        <button
                                            onClick={handleApprove}
                                            disabled={actionLoading}
                                            style={{
                                                flex: 1,
                                                padding: 'var(--space-4)',
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 'var(--radius-lg)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.6 : 1
                                            }}
                                        >
                                            {actionLoading ? 'Processing...' : '✓ Approve'}
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={actionLoading}
                                            style={{
                                                flex: 1,
                                                padding: 'var(--space-4)',
                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 'var(--radius-lg)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.6 : 1
                                            }}
                                        >
                                            {actionLoading ? 'Processing...' : '✗ Reject'}
                                        </button>
                                    </>
                                )}

                                {/* RECONSIDER BUTTON FOR REJECTED */}
                                {selectedDriver.verificationStatus === 'rejected' && (
                                    <button
                                        onClick={handleReconsider}
                                        disabled={actionLoading}
                                        style={{
                                            flex: 1,
                                            padding: 'var(--space-4)',
                                            background: 'var(--warning-500)',
                                            color: 'black',
                                            border: 'none',
                                            borderRadius: 'var(--radius-lg)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        }}
                                    >
                                        {actionLoading ? 'Processing...' : '↺ Reconsider'}
                                    </button>
                                )}

                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={actionLoading}
                                    style={{
                                        flex: selectedDriver.verificationStatus === 'verified' ? 1 : 0.5,
                                        padding: 'var(--space-4) var(--space-6)',
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-lg)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
