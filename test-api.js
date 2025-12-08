// Simple test script to verify backend API
const testAPI = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'testuser@test.com',
                password: 'test123456',
                name: 'Test User',
                phone: '+1234567890',
                role: 'driver',
                vehicleType: 'bike',
                vehicleNumber: 'TEST-999',
                licenseNumber: 'DL-TEST-999'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ SUCCESS! Registration API is working!');
        } else {
            console.log('\n❌ FAILED! Status:', response.status);
        }
    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }
};

testAPI();
