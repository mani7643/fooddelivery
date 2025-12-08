import { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantService';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RestaurantAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const data = await restaurantService.getAnalytics();
            setAnalytics(data.analytics);
        } catch (error) {
            console.error('Error loading analytics:', error);
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
                    Analytics & Insights
                </h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-8)' }}>
                    <div className="card">
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Today's Revenue</h3>
                        <p className="text-3xl font-bold" style={{ color: 'var(--success-400)' }}>
                            ₹{analytics?.todayRevenue || 0}
                        </p>
                    </div>
                    <div className="card">
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Today's Orders</h3>
                        <p className="text-3xl font-bold" style={{ color: 'var(--primary-400)' }}>
                            {analytics?.todayOrders || 0}
                        </p>
                    </div>
                    <div className="card">
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Total Orders</h3>
                        <p className="text-3xl font-bold">
                            {analytics?.totalOrders || 0}
                        </p>
                    </div>
                    <div className="card">
                        <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Rating</h3>
                        <p className="text-3xl font-bold" style={{ color: 'var(--warning-400)' }}>
                            ⭐ {analytics?.rating?.toFixed(1) || '0.0'}
                        </p>
                    </div>
                </div>

                {/* Popular Items */}
                <div className="card">
                    <h2 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-4)' }}>
                        Popular Items
                    </h2>
                    {analytics?.popularItems && analytics.popularItems.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: 'var(--space-3)', textAlign: 'left', color: 'var(--text-secondary)' }}>Rank</th>
                                        <th style={{ padding: 'var(--space-3)', textAlign: 'left', color: 'var(--text-secondary)' }}>Item Name</th>
                                        <th style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--text-secondary)' }}>Orders</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.popularItems.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: 'var(--space-3)' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    background: index < 3 ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                                                    textAlign: 'center',
                                                    lineHeight: '30px',
                                                    fontWeight: 'var(--font-weight-bold)'
                                                }}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                                                {item.name}
                                            </td>
                                            <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: 'var(--success-400)', fontWeight: 'var(--font-weight-semibold)' }}>
                                                {item.count} orders
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--space-8)' }}>
                            No data available yet
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
