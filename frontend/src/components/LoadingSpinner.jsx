export default function LoadingSpinner({ size = 'md' }) {
    const sizes = {
        sm: '24px',
        md: '48px',
        lg: '64px'
    };

    return (
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-8)' }}>
            <div className="animate-spin" style={{
                width: sizes[size],
                height: sizes[size],
                border: '4px solid var(--bg-tertiary)',
                borderTop: '4px solid var(--primary-500)',
                borderRadius: '50%'
            }}></div>
        </div>
    );
}
