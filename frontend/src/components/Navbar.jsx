import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const driverLinks = [
        { path: '/driver', label: '📊 Dashboard', icon: '📊' },
        { path: '/driver/orders', label: '📦 Orders', icon: '📦' },
        { path: '/driver/earnings', label: '💰 Earnings', icon: '💰' },
        { path: '/driver/profile', label: '👤 Profile', icon: '👤' }
    ];

    const restaurantLinks = [
        { path: '/restaurant', label: '📊 Dashboard', icon: '📊' },
        { path: '/restaurant/orders', label: '📦 Orders', icon: '📦' },
        { path: '/restaurant/menu', label: '🍽️ Menu', icon: '🍽️' },
        { path: '/restaurant/analytics', label: '📈 Analytics', icon: '📈' },
        { path: '/restaurant/profile', label: '👤 Profile', icon: '👤' }
    ];

    const links = user?.role === 'driver' ? driverLinks : restaurantLinks;

    return (
        <nav style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-sticky)'
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                gap: 'var(--space-4)'
            }}>
                {/* Logo */}
                <div style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Courier
                </div>

                {/* Navigation Links */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    flex: 1,
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-lg)',
                                textDecoration: 'none',
                                color: isActive(link.path) ? 'var(--primary-400)' : 'var(--text-secondary)',
                                background: isActive(link.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                fontWeight: 'var(--font-weight-medium)',
                                fontSize: 'var(--font-size-sm)',
                                transition: 'all var(--transition-base)',
                                border: isActive(link.path) ? '1px solid var(--primary-500)' : '1px solid transparent'
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* User Menu */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {user?.name}
                    </span>
                    <button
                        onClick={logout}
                        className="btn btn-secondary"
                        style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-sm)' }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}
