import { useState, useEffect } from 'react';
import { driverService } from '../../services/driverService';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DriverProfile() {
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await driverService.getProfile();
            setDriver(data.driver);
            setFormData({
                vehicleType: data.driver.vehicleType,
                vehicleNumber: data.driver.vehicleNumber,
                licenseNumber: data.driver.licenseNumber
            });
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await driverService.updateProfile(formData);
            setEditing(false);
            loadProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Navbar />
            <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
                <h1 className="text-3xl font-bold" style={{ marginBottom: 'var(--space-8)' }}>
                    My Profile
                </h1>

                <div className="card" style={{ maxWidth: '600px' }}>
                    {!editing ? (
                        <>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Vehicle Type</h3>
                                <p className="text-lg">{driver?.vehicleType}</p>
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Vehicle Number</h3>
                                <p className="text-lg">{driver?.vehicleNumber}</p>
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>License Number</h3>
                                <p className="text-lg">{driver?.licenseNumber}</p>
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Rating</h3>
                                <p className="text-lg">⭐ {driver?.rating?.toFixed(1) || '0.0'}</p>
                            </div>
                            <button onClick={() => setEditing(true)} className="btn btn-primary">
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                                    Vehicle Type
                                </label>
                                <select
                                    className="input"
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                >
                                    <option value="bike">Bike</option>
                                    <option value="scooter">Scooter</option>
                                    <option value="car">Car</option>
                                    <option value="bicycle">Bicycle</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                                    Vehicle Number
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.vehicleNumber}
                                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                                    License Number
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                                <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
