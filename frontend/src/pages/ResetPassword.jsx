import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/authService';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('✅ ResetPassword component loaded');
        console.log('🔑 Token:', token);
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(password)) {
            setError('Password must be at least 8 characters long, contain at least one capital letter, and one symbol (!@#$%^&*).');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(token, password);
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
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
                        Enter your new secure password
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
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                Min 8 chars, 1 uppercase & 1 symbol
                            </p>
                        </div>

                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={8}
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
                                    Resetting...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
