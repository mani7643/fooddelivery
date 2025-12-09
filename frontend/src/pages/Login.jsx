import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [role, setRole] = useState('driver');
    const [formData, setFormData] = useState({
        emailOrPhone: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Backend expects emailOrPhone
            const data = await login(formData);

            // Verify role matches selection
            if (role === 'admin' && data.user.role !== 'admin') {
                setError('Access denied. You are not an administrator.');
                return;
            }
            if (role === 'driver' && data.user.role !== 'driver') {
                setError('Please login using the correct portal for your account type.');
                return;
            }

            // Check for rejected driver
            if (role === 'driver' && data.user.verificationStatus === 'rejected') {
                alert(`Your account verification was rejected.\n\nReason: ${data.user.verificationNotes || 'Documents unclear'}\n\nPlease upload valid documents again.`);
                navigate('/driver/upload-documents');
                return;
            }

            navigate(`/${data.user.role}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
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
                        Courier Partner
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                        Welcome back! Sign in to continue
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass" style={{
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-2xl)'
                }}>
                    {/* Role Selection Tabs */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-secondary)',
                        padding: 'var(--space-1)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--space-6)'
                    }}>
                        <button
                            type="button"
                            onClick={() => setRole('driver')}
                            style={{
                                flex: 1,
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: role === 'driver' ? 'var(--surface-raised)' : 'transparent',
                                color: role === 'driver' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                fontWeight: 'var(--font-weight-medium)',
                                boxShadow: role === 'driver' ? 'var(--shadow-sm)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Driver Partner
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('admin')}
                            style={{
                                flex: 1,
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: role === 'admin' ? 'var(--surface-raised)' : 'transparent',
                                color: role === 'admin' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                fontWeight: 'var(--font-weight-medium)',
                                boxShadow: role === 'admin' ? 'var(--shadow-sm)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Admin
                        </button>
                    </div>

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

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                Email or Phone
                            </label>
                            <input
                                type="text"
                                name="emailOrPhone"
                                value={formData.emailOrPhone}
                                onChange={handleChange}
                                className="input"
                                placeholder={role === 'admin' ? 'admin@courier.com' : 'Email or Phone Number'}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                            <div style={{ textAlign: 'right', marginTop: 'var(--space-2)' }}>
                                <Link to="/forgot-password" style={{
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--primary-400)',
                                    textDecoration: 'none'
                                }}>
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
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
                                    Signing in as {role === 'admin' ? 'Admin' : 'Driver'}...
                                </span>
                            ) : (
                                `Sign In as ${role === 'admin' ? 'Admin' : 'Driver'}`
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: 'var(--space-6)',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{
                            color: 'var(--primary-400)',
                            textDecoration: 'none',
                            fontWeight: 'var(--font-weight-medium)'
                        }}>
                            Sign up
                        </Link>
                    </div>
                </div>

                {/* Demo Credentials */}
                <div style={{
                    marginTop: 'var(--space-6)',
                    padding: 'var(--space-4)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-tertiary)',
                        marginBottom: 'var(--space-2)'
                    }}>
                        💡 <strong>Demo Tip:</strong> Register as a Raider
                    </p>
                </div>
            </div>
        </div>
    );
}
