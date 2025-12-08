import { useState, useEffect } from 'react';
import { driverService } from '../../services/driverService';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DriverEarnings() {
    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEarnings();
    }, []);

    const loadEarnings = async () => {
        try {
            const data = await driverService.getEarnings();
            setEarnings(data.earnings);
        } catch (error) {
            console.error('Error loading earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Navbar />
            <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
                <h1 className="text-3xl font-bold" style={{ marginBottom: 'var(--space-8)' }}>
                    Earnings
                </h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-3" style={{ marginBottom: 'var(--space-8)' }}>
                    <div className="card">
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Today's Earnings</h3>
                        <p className="text-3xl font-bold" style={{ color: 'var(--success-400)' }}>
                            ₹{earnings?.today || 0}
                        </p>
                    </div>
                    <div className="card">
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Total Earnings</h3>
                        <p className="text-3xl font-bold" style={{ color: 'var(--primary-400)' }}>
                            ₹{earnings?.total || 0}
                        </p>
                    </div>
                    <div className="card">
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Total Deliveries</h3>
                        <p className="text-3xl font-bold">
                            {earnings?.totalDeliveries || 0}
                        </p>
                    </div>
                </div>

                {/* Earnings History */}
                <div className="card">
                    <h2 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-4)' }}>
                        Earnings History
                    </h2>
                    {earnings?.history && earnings.history.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: 'var(--space-3)', textAlign: 'left', color: 'var(--text-secondary)' }}>Order ID</th>
                                        <th style={{ padding: 'var(--space-3)', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                                        <th style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--text-secondary)' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {earnings.history.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: 'var(--space-3)' }}>{item.orderId}</td>
                                            <td style={{ padding: 'var(--space-3)', color: 'var(--text-secondary)' }}>
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--success-400)', fontWeight: 'var(--font-weight-semibold)' }}>
                                                ₹{item.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-8)' }}>
                            No earnings history yet
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
