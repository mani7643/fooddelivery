import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [role, setRole] = useState('driver');
    const [loginMethod, setLoginMethod] = useState('phone'); // 'email' or 'phone'
    const [formData, setFormData] = useState({
        emailOrPhone: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        let value = e.target.value;

        // Validation for Phone Number
        if (loginMethod === 'phone' && e.target.name === 'emailOrPhone') {
            // Allow only numbers
            value = value.replace(/\D/g, '');
            // Limit to 10 digits
            if (value.length > 10) value = value.slice(0, 10);
        }

        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleMethodChange = (method) => {
        setLoginMethod(method);
        setFormData({ ...formData, emailOrPhone: '' });
        setError('');
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

                    {/* Method Selection (Email vs Phone) */}
                    <div style={{
                        display: 'flex',
                        gap: 'var(--space-4)',
                        marginBottom: 'var(--space-6)',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: 'var(--space-2)'
                    }}>
                        <button
                            type="button"
                            onClick={() => handleMethodChange('phone')}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                border: 'none',
                                background: 'transparent',
                                color: loginMethod === 'phone' ? 'var(--primary-500)' : 'var(--text-tertiary)',
                                fontWeight: loginMethod === 'phone' ? 'bold' : 'normal',
                                borderBottom: loginMethod === 'phone' ? '2px solid var(--primary-500)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Phone Number
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMethodChange('email')}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                border: 'none',
                                background: 'transparent',
                                color: loginMethod === 'email' ? 'var(--primary-500)' : 'var(--text-tertiary)',
                                fontWeight: loginMethod === 'email' ? 'bold' : 'normal',
                                borderBottom: loginMethod === 'email' ? '2px solid var(--primary-500)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Email Address
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
                                {loginMethod === 'phone' ? 'Mobile Number (10 digits)' : 'Email Address'}
                            </label>
                            {loginMethod === 'phone' ? (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{
                                        padding: 'var(--space-3)',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRight: 'none',
                                        borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
                                        color: 'var(--text-secondary)',
                                        fontSize: 'var(--font-size-md)'
                                    }}>
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        name="emailOrPhone"
                                        value={formData.emailOrPhone}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="9876543210"
                                        style={{ borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }}
                                        required
                                    />
                                </div>
                            ) : (
                                <input
                                    type="email"
                                    name="emailOrPhone"
                                    value={formData.emailOrPhone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="admin@courier.com"
                                    required
                                />
                            )}
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
