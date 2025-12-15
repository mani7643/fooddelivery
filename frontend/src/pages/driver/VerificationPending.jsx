import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function VerificationPending() {
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState('pending_verification');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkVerificationStatus();
        // Poll every 30 seconds to check if approved
        const interval = setInterval(checkVerificationStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkVerificationStatus = async () => {
        try {
            const response = await api.get('/driver/documents');
            const status = response.data.verificationStatus;
            setVerificationStatus(status);

            // If verified, redirect to dashboard
            if (status === 'verified') {
                navigate('/driver');
                return;
            }
            // Only redirect to upload if strictly pending_documents
            if (status === 'pending_documents') {
                navigate('/driver/upload-documents');
                return;
            }
        } catch (error) {
            console.error('Error checking verification status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <div className="animate-spin" style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid var(--bg-tertiary)',
                    borderTop: '4px solid var(--primary-500)',
                    borderRadius: '50%'
                }}></div>
            </div>
        );
    }

    if (verificationStatus === 'rejected') {
        return (
            <div style={{ minHeight: '100vh', padding: 'var(--space-6)', background: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: 'var(--space-12)', textAlign: 'center' }}>
                    <div style={{ fontSize: '80px', marginBottom: 'var(--space-4)' }}>❌</div>
                    <h1 className="text-4xl font-bold" style={{
                        color: 'var(--danger-500)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        Verification Rejected
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-8)' }}>
                        Unfortunately, your documents were not approved. Please review the requirements and upload again.
                    </p>

                    <div className="glass" style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-2xl)' }}>
                        <button
                            onClick={() => navigate('/driver/upload-documents')}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: 'var(--space-4)',
                                fontSize: 'var(--font-size-lg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-3)'
                            }}
                        >
                            <span>📤</span>
                            Re-upload Documents
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: 'var(--space-6)', background: 'var(--bg-primary)' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: 'var(--space-12)' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                    <div style={{ fontSize: '80px', marginBottom: 'var(--space-4)' }}>⏳</div>
                    <h1 className="text-4xl font-bold" style={{
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--space-2)'
                    }}>
                        Verification Pending
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                        Your documents are under review
                    </p>
                </div>

                {/* Card */}
                <div className="glass" style={{
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-2xl)',
                    marginBottom: 'var(--space-6)'
                }}>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                        <h3 style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--space-3)',
                            color: 'var(--text-primary)'
                        }}>
                            What's Next?
                        </h3>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            color: 'var(--text-secondary)'
                        }}>
                            <li style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'flex-start' }}>
                                <span style={{ marginRight: 'var(--space-2)' }}>✓</span>
                                <span>Your documents have been submitted successfully</span>
                            </li>
                            <li style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'flex-start' }}>
                                <span style={{ marginRight: 'var(--space-2)' }}>⏳</span>
                                <span>Our team is reviewing your documents</span>
                            </li>
                            <li style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'flex-start' }}>
                                <span style={{ marginRight: 'var(--space-2)' }}>📧</span>
                                <span>You'll receive an email once approved</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start' }}>
                                <span style={{ marginRight: 'var(--space-2)' }}>🚀</span>
                                <span>After approval, you can start accepting orders</span>
                            </li>
                        </ul>
                    </div>

                    <div style={{
                        padding: 'var(--space-4)',
                        background: 'rgba(79, 70, 229, 0.1)',
                        border: '1px solid var(--primary-500)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <p style={{
                            color: 'var(--primary-400)',
                            fontSize: 'var(--font-size-sm)',
                            margin: 0
                        }}>
                            <strong>Estimated Review Time:</strong> 24-48 hours
                        </p>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                            Need help? Contact support at{' '}
                            <a href="mailto:support@courier.com" style={{ color: 'var(--primary-400)' }}>
                                support@courier.com
                            </a>
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: 'var(--space-2) var(--space-4)',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgb(234, 179, 8)',
                        borderRadius: 'var(--radius-full)',
                        color: 'rgb(234, 179, 8)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)'
                    }}>
                        Status: {verificationStatus === 'pending_verification' ? 'Under Review' : verificationStatus}
                    </div>
                </div>
            </div>
        </div>
    );
}
