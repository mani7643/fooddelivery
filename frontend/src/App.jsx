import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverOrders from './pages/driver/DriverOrders';
import DriverEarnings from './pages/driver/DriverEarnings';
import DriverProfile from './pages/driver/DriverProfile';
import UploadDocuments from './pages/driver/UploadDocuments';
import Debug from './Debug';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <div className="animate-spin" style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid var(--bg-tertiary)',
                    borderTop: '4px solid var(--primary-500)',
                    borderRadius: '50%'
                }}></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={`/${user.role}`} replace />;
    }

    return children;
};

function App() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resetpassword/:token" element={<ResetPassword />} />
            <Route path="/debug" element={<Debug />} />

            {/* Driver Routes */}
            <Route path="/driver" element={<ProtectedRoute allowedRole="driver"><DriverDashboard /></ProtectedRoute>} />
            <Route path="/driver/upload-documents" element={<ProtectedRoute allowedRole="driver"><UploadDocuments /></ProtectedRoute>} />
            <Route path="/driver/orders" element={<ProtectedRoute allowedRole="driver"><DriverOrders /></ProtectedRoute>} />
            <Route path="/driver/earnings" element={<ProtectedRoute allowedRole="driver"><DriverEarnings /></ProtectedRoute>} />
            <Route path="/driver/profile" element={<ProtectedRoute allowedRole="driver"><DriverProfile /></ProtectedRoute>} />

            {/* Default Route */}
            <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;
