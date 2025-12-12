import api from './services/api';

console.log('=== API Configuration Debug ===');
console.log('API Instance:', api);
console.log('API Defaults:', api.defaults);
console.log('Base URL:', api.defaults.baseURL);
console.log('================================');

// Test the API
async function testAPI() {
    try {
        console.log('Testing API call to /auth/register...');
        const response = await api.post('/auth/register', {
            email: 'debug@test.com',
            password: 'test123',
            name: 'Debug Test',
            phone: '+1234567890',
            role: 'driver',
            vehicleType: 'bike',
            vehicleNumber: 'DEBUG-123',
            licenseNumber: 'DL-DEBUG'
        });
        console.log('API Test SUCCESS:', response.data);
    } catch (error) {
        console.error('API Test FAILED:', error);
        console.error('Error Response:', error.response);
        console.error('Error Config:', error.config);
    }
}

// Run test after 2 seconds
// setTimeout(testAPI, 2000);

export default function Debug() {
    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>API Debug Page</h1>
            <p>Check the browser console (F12) for debug information</p>
            <button onClick={testAPI}>Test API Call</button>
        </div>
    );
}
