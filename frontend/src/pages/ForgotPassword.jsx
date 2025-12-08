import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setMessage('Email sent! check your inbox (and console for dev).');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
            <div className="animate-slide-up" style={{ width: '100%', maxWidth: '450px' }}>
                {/* Header */}
                <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 className="text-4xl font-bold" style={{
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--space-2)'
                    }}>
                        Reset Password
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                        Enter your email to receive a reset link
                    </p>
                </div>

                {/* Card */}
                <div className="glass" style={{
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-2xl)'
                }}>
                    {error && (
                        <div style={{
                            padding: 'var(--space-4)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--danger-500)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--danger-400)',
                            marginBottom: 'var(--space-6)'
                        }}>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div style={{
                            padding: 'var(--space-4)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid var(--success-500)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'var(--success-400)',
                            marginBottom: 'var(--space-6)'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || message}
                            style={{ width: '100%', padding: 'var(--space-4)' }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin" style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%'
                                    }}></span>
                                    Sending...
                                </span>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: 'var(--space-6)',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        Remember your password?{' '}
                        <Link to="/login" style={{
                            color: 'var(--primary-400)',
                            textDecoration: 'none',
                            fontWeight: 'var(--font-weight-medium)'
                        }}>
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
