import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        otp: '',
        role: 'driver', // Always driver
        vehicleType: 'bike',
        vehicleNumber: '',
        licenseNumber: ''
    });
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSendEmailOtp = async () => {
        if (!formData.email) {
            setError('Please enter your email address first');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await authService.sendEmailOtp(formData.email);
            setOtpSent(true);
            setTimer(30); // Start 30s timer
            alert('OTP sent to your email! Please check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!otpSent) {
            setError('Please verify your email first by clicking Send OTP');
            return;
        }

        // Password Validation
        const password = formData.password;
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;

        if (!passwordRegex.test(password)) {
            setError('Password must be at least 8 characters long, contain at least one capital letter, and one symbol (!@#$%^&*).');
            return;
        }

        // Vehicle Number Validation (Indian Format)
        const vehicleNumber = formData.vehicleNumber.replace(/\s/g, ''); // Remove spaces for check
        // Regex: 2 chars (State) + 2 digits (Dist) + 1-3 chars (Series, optional) + 4 digits (Num)
        // e.g., MH01AB1234, MH011234
        const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$/;

        if (!vehicleRegex.test(vehicleNumber)) {
            setError('Please enter a valid Indian vehicle number (e.g., MH01AB1234)');
            return;
        }

        // Driving License Validation (Indian Format)
        const licenseNumber = formData.licenseNumber.replace(/\s|-/g, ''); // Remove spaces/dashes
        // Regex: 15 alphanumeric characters (State Code + RTO + Year + Digits)
        // e.g. MH1420110012345
        const licenseRegex = /^[A-Z]{2}[0-9]{13}$/;

        if (!licenseRegex.test(licenseNumber)) {
            setError('Please enter a valid Indian Driving License number (15 characters without spaces, e.g. MH1420110012345)');
            return;
        }

        setLoading(true);

        try {
            // Combine first and last name
            const submissionData = {
                ...formData,
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                phone: `+91 ${formData.phone}`
            };
            const data = await register(submissionData);
            // Redirect to document upload page for verification
            navigate('/driver/upload-documents');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: 'var(--space-4)' }}>
            <div className="animate-slide-up" style={{ width: '100%', maxWidth: '500px' }}>
                {/* Header */}
                <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 className="text-4xl font-bold" style={{
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--space-2)'
                    }}>
                        Delivery Partner
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
                        Join our delivery network
                    </p>
                </div>

                {/* Registration Card */}
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

                    <form onSubmit={handleSubmit}>
                        {/* Title */}
                        <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
                            <h3 style={{
                                color: 'var(--primary-400)',
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 'var(--font-weight-semibold)'
                            }}>
                                🏍️ Partner Registration
                            </h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
                                Start earning with us today
                            </p>
                        </div>

                        {/* Name Fields Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                            {/* First Name */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-2)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-2)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
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
                            <div className="input" style={{ display: 'flex', alignItems: 'center', padding: '0', overflow: 'hidden', paddingRight: '4px' }}>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={{
                                        border: 'none',
                                        flex: 1,
                                        padding: 'var(--space-3)',
                                        outline: 'none',
                                        background: 'transparent',
                                        color: 'white'
                                    }}
                                    required
                                    disabled={otpSent}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendEmailOtp}
                                    disabled={(otpSent && timer > 0) || !formData.email || loading}
                                    style={{
                                        border: 'none',
                                        background: (otpSent && timer > 0) ? 'var(--surface-sunken)' : 'var(--primary-500)',
                                        color: (otpSent && timer > 0) ? 'var(--text-tertiary)' : 'white',
                                        padding: '4px 12px',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.75rem',
                                        cursor: (otpSent && timer > 0) ? 'not-allowed' : 'pointer',
                                        marginRight: '4px',
                                        minWidth: '100px'
                                    }}
                                >
                                    {otpSent
                                        ? (timer > 0 ? `Resend in ${timer}s` : 'Resend OTP')
                                        : 'Send OTP'
                                    }
                                </button>
                            </div>
                        </div>

                        {/* OTP Input */}
                        {otpSent && (
                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-2)',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    name="otp"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Enter 6-digit OTP"
                                    required
                                    maxLength="6"
                                    pattern="[0-9]{6}"
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                    Check your email for the verification code
                                </p>
                            </div>
                        )}

                        {/* Phone */}
                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                Phone Number
                            </label>
                            <div className="input" style={{ display: 'flex', alignItems: 'center', padding: '0', overflow: 'hidden' }}>
                                <span style={{
                                    padding: 'var(--space-3)',
                                    background: 'var(--surface-sunken)',
                                    color: 'white',
                                    borderRight: '1px solid var(--border-subtle)'
                                }}>
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    style={{
                                        border: 'none',
                                        flex: 1,
                                        padding: 'var(--space-3)',
                                        outline: 'none',
                                        background: 'transparent',
                                        color: 'white'
                                    }}
                                    required
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    title="Please enter 10 digit mobile number"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 'var(--space-5)' }}>
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
                                minLength={8}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                Min 8 chars, 1 uppercase & 1 symbol
                            </p>
                        </div>

                        {/* Vehicle Type */}
                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                Vehicle Type
                            </label>
                            <select
                                name="vehicleType"
                                value={formData.vehicleType}
                                onChange={handleChange}
                                className="input"
                                required
                            >
                                <option value="bike">Bike</option>
                                <option value="scooter">Scooter</option>
                                <option value="car">Car</option>
                                <option value="bicycle">Bicycle</option>
                            </select>
                        </div>

                        {/* Vehicle Number */}
                        <div style={{ marginBottom: 'var(--space-5)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                Vehicle Number
                            </label>
                            <input
                                type="text"
                                name="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={(e) => {
                                    const upperValue = e.target.value.toUpperCase();
                                    setFormData({ ...formData, vehicleNumber: upperValue });
                                }}
                                className="input"
                                required
                                style={{ textTransform: 'uppercase' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                Indian format required (e.g. MH01AB1234)
                            </p>
                        </div>

                        {/* License Number */}
                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-secondary)'
                            }}>
                                License Number
                            </label>
                            <input
                                type="text"
                                name="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={(e) => {
                                    const upperValue = e.target.value.toUpperCase();
                                    setFormData({ ...formData, licenseNumber: upperValue });
                                }}
                                className="input"
                                required
                                maxLength="15"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                Indian format required (15 chars, e.g. MH1420110012345)
                            </p>
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
                                    Creating account...
                                </span>
                            ) : (
                                'Join as Partner'
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: 'var(--space-6)',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{
                            color: 'var(--primary-400)',
                            textDecoration: 'none',
                            fontWeight: 'var(--font-weight-medium)'
                        }}>
                            Sign in
                        </Link>
                    </div>
                </div>
            </div >
        </div >
    );
}
