export default function OrderCard({ order, onAccept, onReject, onUpdateStatus, userRole }) {
    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            accepted: 'primary',
            preparing: 'primary',
            ready: 'success',
            picked: 'purple',
            delivered: 'success',
            cancelled: 'danger'
        };
        return colors[status] || 'primary';
    };

    const formatTime = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-4)' }}>
                <div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                        Order #{order.orderId}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {formatTime(order.createdAt)}
                    </p>
                </div>
                <span className={`badge badge-${getStatusColor(order.status)}`}>
                    {order.status}
                </span>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ marginBottom: 'var(--space-2)' }}>
                    <strong style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Customer:</strong>
                    <p style={{ marginTop: 'var(--space-1)' }}>{order.customerName}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{order.customerPhone}</p>
                </div>

                {order.items && order.items.length > 0 && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                        <strong style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Items:</strong>
                        <ul style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)' }}>
                            {order.items.map((item, index) => (
                                <li key={index} style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    {item.quantity}x {item.name} - ${item.price}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                    <strong style={{ fontSize: 'var(--font-size-lg)' }}>Total: ${order.totalAmount}</strong>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                {userRole === 'restaurant' && order.status === 'pending' && (
                    <>
                        <button onClick={() => onAccept(order._id)} className="btn btn-success" style={{ flex: 1 }}>
                            Accept Order
                        </button>
                        <button onClick={() => onReject(order._id)} className="btn btn-danger" style={{ flex: 1 }}>
                            Reject
                        </button>
                    </>
                )}

                {userRole === 'restaurant' && order.status === 'accepted' && (
                    <button onClick={() => onUpdateStatus(order._id, 'preparing')} className="btn btn-primary" style={{ flex: 1 }}>
                        Start Preparing
                    </button>
                )}

                {userRole === 'restaurant' && order.status === 'preparing' && (
                    <button onClick={() => onUpdateStatus(order._id, 'ready')} className="btn btn-success" style={{ flex: 1 }}>
                        Mark as Ready
                    </button>
                )}

                {userRole === 'driver' && order.status === 'ready' && (
                    <button onClick={() => onAccept(order._id)} className="btn btn-primary" style={{ flex: 1 }}>
                        Pick Up Order
                    </button>
                )}

                {userRole === 'driver' && order.status === 'picked' && (
                    <button onClick={() => onUpdateStatus(order._id, 'delivered')} className="btn btn-success" style={{ flex: 1 }}>
                        Mark as Delivered
                    </button>
                )}
            </div>
        </div>
    );
}
