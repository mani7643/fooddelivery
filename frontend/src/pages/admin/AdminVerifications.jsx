import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { initiateSocketConnection, disconnectSocket, subscribeToDriverUpdates, joinAdminRoom } from '../../services/socket';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function AdminVerifications() {
    const navigate = useNavigate();
    const { logout, user } = useAuth(); // Added user here
    const [viewMode, setViewMode] = useState('verifications'); // 'verifications', 'verified', 'rejected', 'online', 'admins'

    // Helper to handle both local uploads and S3 URLs
    const getDocumentUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
    };

    const [drivers, setDrivers] = useState([]);
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

        // Initialize socket
        const token = localStorage.getItem('token');
        if (token) {
            initiateSocketConnection(token);
            // We need userId to join room, but we don't have it easily accessible here without decoding token or from context
            // Assuming useAuth provides user object
        }

        return () => {
            disconnectSocket();
        }
    }, [viewMode]);

    useEffect(() => {
        if (user && user._id) {
            joinAdminRoom(user._id);
        }
    }, [user]);

    useEffect(() => {
        if (viewMode === 'online') {
            subscribeToDriverUpdates((err, data) => {
                if (data) {
                    setDrivers(prevDrivers => {
                        return prevDrivers.map(d => {
                            if (d._id === data.driverId) {
                                return {
                                    ...d,
                                    currentLocation: {
                                        type: 'Point',
                                        coordinates: data.location.coordinates
                                    }
                                };
                            }
                            return d;
                        });
                    });
                }
            });
        }
    }, [viewMode]);

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
            setDrivers(response.data.drivers || []);
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
            logout();
            navigate('/login');
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
                    alignItems: 'flex-start'
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
                        onClick={handleLogout}
                        className="btn"
                        style={{
                            background: 'var(--surface-raised)',
                            color: 'var(--danger-400)',
                            border: '1px solid var(--border-color)',
                            padding: 'var(--space-3) var(--space-6)',
                            fontWeight: 'var(--font-weight-medium)',
                            boxShadow: 'var(--shadow-sm)'
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
                            gap: 'var(--space-2)'
                        }}
                    >
                        Online Drivers 🟢
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
                                        {viewMode === 'verifications' ? '✅' : viewMode === 'verified' ? '📂' : viewMode === 'online' ? '😴' : '🚫'}
                                    </div>
                                    <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
                                        {viewMode === 'verifications' ? 'All Drivers Verified!' : viewMode === 'verified' ? 'No Verified Drivers Found' : viewMode === 'online' ? 'No Online Drivers' : 'No Rejected Drivers'}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {viewMode === 'verifications' ? 'No pending driver verifications at the moment.' : viewMode === 'verified' ? 'No drivers have been verified yet.' : viewMode === 'online' ? 'No drivers are currently online.' : 'No drivers currently rejected.'}
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
                                                    {viewMode === 'online' && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#10b981' }}>● Online</span>}
                                                </h3>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                                    <p>📧 {driver.userId?.email}</p>
                                                    <p>📱 {driver.userId?.phone || driver.phone}</p>
                                                    <p>🚗 {driver.vehicleType} - {driver.vehicleNumber}</p>
                                                    {viewMode === 'online' && driver.currentLocation?.coordinates && (driver.currentLocation.coordinates[0] !== 0 || driver.currentLocation.coordinates[1] !== 0) && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${driver.currentLocation.coordinates[1]},${driver.currentLocation.coordinates[0]}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--primary-500)', display: 'block', textDecoration: 'underline' }}
                                                            title={`Lat: ${driver.currentLocation.coordinates[1]}, Lng: ${driver.currentLocation.coordinates[0]}`}
                                                        >
                                                            📍 Location: {driver.currentLocation.coordinates[1].toFixed(4)}, {driver.currentLocation.coordinates[0].toFixed(4)} ↗️
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleViewDriver(driver)}
                                                className="btn btn-primary"
                                                style={{ padding: 'var(--space-3) var(--space-6)' }}
                                            >
                                                {viewMode === 'verified' || viewMode === 'rejected' || viewMode === 'online' ? 'View Details' : 'Review Documents'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}



                        {viewMode === 'online' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                                {/* Debug Log */}
                                {console.log('Online Drivers Render:', drivers)}
                                {/* Left Side: Driver List */}
                                <div className="glass" style={{
                                    borderRadius: 'var(--radius-xl)',
                                    overflowY: 'auto',
                                    padding: 'var(--space-4)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-4)'
                                }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', zIndex: 10, paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Active Drivers ({drivers.length})</span>
                                        <button
                                            onClick={() => {
                                                if (drivers.length > 0) {
                                                    const d = drivers[0];
                                                    // Simulate movement
                                                    const newLat = (d.currentLocation?.coordinates[1] || 12.9716) + 0.001;
                                                    const newLng = (d.currentLocation?.coordinates[0] || 77.5946) + 0.001;

                                                    // Emit fake socket event locally to test UI
                                                    // Note: This won't update DB, just local view via socket listener
                                                    // We need to manually trigger the listener callback if we can't emit to self easily, 
                                                    // but better to actually emit if possible. 
                                                    // Since we can't easily emit from here to *our* listener without server reflection,
                                                    // we will manually update state for testing.
                                                    setDrivers(prev => prev.map(p =>
                                                        p._id === d._id ? { ...p, currentLocation: { type: 'Point', coordinates: [newLng, newLat] } } : p
                                                    ));
                                                }
                                            }}
                                            style={{ fontSize: '0.7rem', padding: '2px 5px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Simulate Move
                                        </button>
                                    </h3>
                                    {drivers.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>😴</div>
                                            <p>No drivers online</p>
                                        </div>
                                    ) : (
                                        drivers.map(driver => (
                                            <div
                                                key={driver._id}
                                                style={{
                                                    padding: 'var(--space-4)',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: 'var(--radius-lg)',
                                                    cursor: 'pointer',
                                                    border: '1px solid transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-500)'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: '600' }}>{driver.userId?.name || driver.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#10b981', background: '#d1fae5', padding: '2px 6px', borderRadius: '10px' }}>Online</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <div>🚗 {driver.vehicleType} - {driver.vehicleNumber}</div>
                                                    <div>📞 {driver.userId?.phone || driver.phone}</div>
                                                </div>
                                                {driver.currentLocation?.coordinates && (
                                                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                        Lat: {driver.currentLocation.coordinates[1].toFixed(4)}, Lng: {driver.currentLocation.coordinates[0].toFixed(4)}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Right Side: Map */}
                                <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', position: 'relative', zIndex: 0, border: '1px solid var(--border-color)' }}>
                                    <MapContainer
                                        center={[20.5937, 78.9629]}
                                        zoom={5}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        {drivers.map(driver => (
                                            driver.currentLocation?.coordinates &&
                                            (driver.currentLocation.coordinates[1] !== 0 || driver.currentLocation.coordinates[0] !== 0) && (
                                                <Marker
                                                    key={driver._id}
                                                    position={[driver.currentLocation.coordinates[1], driver.currentLocation.coordinates[0]]}
                                                >
                                                    <Popup>
                                                        <div style={{ minWidth: '200px' }}>
                                                            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>{driver.userId?.name || driver.name}</h3>
                                                            <p style={{ margin: '0 0 5px 0' }}>🚗 {driver.vehicleType} - {driver.vehicleNumber}</p>
                                                            <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                                                                {driver.currentLocation.coordinates[1].toFixed(5)}, {driver.currentLocation.coordinates[0].toFixed(5)}
                                                            </div>
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
