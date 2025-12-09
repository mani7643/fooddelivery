import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AdminVerifications() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('verifications'); // 'verifications' or 'admins'
    const [drivers, setDrivers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (viewMode === 'verifications') {
            fetchPendingDrivers();
        } else {
            fetchPendingAdmins();
        }
    }, [viewMode]);

    const fetchPendingDrivers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/pending-verifications');
            setDrivers(response.data.drivers);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingAdmins = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/pending-admins');
            setAdmins(response.data.admins);
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
        } catch (error) {
            alert('Error rejecting driver: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-6)', background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--space-8)' }}>
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
                        {drivers.length > 0 && (
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
                        {/* DRIVER VERIFICATIONS LIST */}
                        {viewMode === 'verifications' && (
                            drivers.length === 0 ? (
                                <div className="glass" style={{
                                    padding: 'var(--space-12)',
                                    borderRadius: 'var(--radius-2xl)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)' }}>✅</div>
                                    <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
                                        All Drivers Verified!
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        No pending driver verifications at the moment.
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
                                                Review Documents
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
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
                                                src={selectedDriver.documents.aadhaarFront}
                                                alt="Aadhaar Front"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => window.open(selectedDriver.documents.aadhaarFront, '_blank')}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.aadhaarBack && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>Aadhaar Back</p>
                                            <img
                                                src={selectedDriver.documents.aadhaarBack}
                                                alt="Aadhaar Back"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => window.open(selectedDriver.documents.aadhaarBack, '_blank')}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.dlFront && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>DL Front</p>
                                            <img
                                                src={selectedDriver.documents.dlFront}
                                                alt="DL Front"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => window.open(selectedDriver.documents.dlFront, '_blank')}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.dlBack && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>DL Back</p>
                                            <img
                                                src={selectedDriver.documents.dlBack}
                                                alt="DL Back"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => window.open(selectedDriver.documents.dlBack, '_blank')}
                                            />
                                        </div>
                                    )}
                                    {selectedDriver.documents?.panCard && (
                                        <div>
                                            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>PAN Card</p>
                                            <img
                                                src={selectedDriver.documents.panCard}
                                                alt="PAN Card"
                                                style={{ width: '100%', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                                onClick={() => window.open(selectedDriver.documents.panCard, '_blank')}
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
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={actionLoading}
                                    style={{
                                        padding: 'var(--space-4) var(--space-6)',
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-secondary)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-lg)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
