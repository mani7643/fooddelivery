// Test multiple endpoints
const testEndpoints = async () => {
    const tests = [
        { name: 'Root', url: 'http://localhost:5000/', method: 'GET' },
        { name: 'Test GET', url: 'http://localhost:5000/test', method: 'GET' },
        { name: 'Test POST', url: 'http://localhost:5000/test-post', method: 'POST', body: { test: 'data' } },
        {
            name: 'Auth Register', url: 'http://localhost:5000/api/auth/register', method: 'POST', body: {
                email: 'test@test.com',
                password: 'test123',
                name: 'Test',
                phone: '123',
                role: 'driver',
                vehicleType: 'bike',
                vehicleNumber: 'TEST',
                licenseNumber: 'TEST'
            }
        }
    ];

    for (const test of tests) {
        try {
            const options = {
                method: test.method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const response = await fetch(test.url, options);
            const data = await response.json();

            console.log(`\n${test.name}:`);
            console.log(`  Status: ${response.status}`);
            console.log(`  Response:`, JSON.stringify(data).substring(0, 100));
        } catch (error) {
            console.log(`\n${test.name}: ERROR -`, error.message);
        }
    }
};

testEndpoints();
