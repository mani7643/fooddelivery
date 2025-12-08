import { useState, useEffect } from 'react';
import { restaurantService } from '../../services/restaurantService';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RestaurantProfile() {
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await restaurantService.getProfile();
            setRestaurant(data.restaurant);
            setFormData({
                businessName: data.restaurant.businessName,
                cuisineTypes: data.restaurant.cuisineTypes?.join(', ') || ''
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
            await restaurantService.updateProfile({
                businessName: formData.businessName,
                cuisineTypes: formData.cuisineTypes.split(',').map(c => c.trim())
            });
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
                    Restaurant Profile
                </h1>

                <div className="card" style={{ maxWidth: '600px' }}>
                    {!editing ? (
                        <>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Business Name</h3>
                                <p className="text-lg">{restaurant?.businessName}</p>
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Cuisine Types</h3>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                    {restaurant?.cuisineTypes?.map((cuisine, index) => (
                                        <span key={index} className="badge badge-primary">{cuisine}</span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Rating</h3>
                                <p className="text-lg">⭐ {restaurant?.rating?.toFixed(1) || '0.0'}</p>
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Total Orders</h3>
                                <p className="text-lg">{restaurant?.totalOrders || 0}</p>
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Total Revenue</h3>
                                <p className="text-lg" style={{ color: 'var(--success-400)' }}>
                                    ₹{restaurant?.totalRevenue || 0}
                                </p>
                            </div>
                            <button onClick={() => setEditing(true)} className="btn btn-primary">
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 'var(--space-5)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.businessName}
                                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                                    Cuisine Types (comma separated)
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.cuisineTypes}
                                    onChange={(e) => setFormData({ ...formData, cuisineTypes: e.target.value })}
                                    placeholder="Italian, Chinese, Indian"
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
