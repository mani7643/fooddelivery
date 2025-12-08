export default function StatsCard({ icon, label, value, trend, color = 'primary' }) {
    const colorMap = {
        primary: 'var(--primary-500)',
        success: 'var(--success-500)',
        warning: 'var(--warning-500)',
        danger: 'var(--danger-500)',
        purple: 'var(--purple-500)'
    };

    return (
        <div className="card animate-slide-up" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)'
        }}>
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-xl)',
                background: `linear-gradient(135deg, ${colorMap[color]}, ${colorMap[color]}dd)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-2xl)',
                flexShrink: 0
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-1)'
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--text-primary)'
                }}>
                    {value}
                </div>
                {trend && (
                    <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: trend.startsWith('+') ? 'var(--success-400)' : 'var(--danger-400)',
                        marginTop: 'var(--space-1)'
                    }}>
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}
