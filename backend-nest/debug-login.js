const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken'); // Need to install jsonwebtoken if not present, checking package.json would be good but standard for backend-nest likely has it or @nestjs/jwt uses it. I'll rely on nested dep or just simple check.
// Actually, I can't be sure valid jsonwebtoken is available in root if it's in node_modules of backend-nest.
// I'll make sure to require from logic that works.
// Or I can mock the JWT part if that's not the issue, but it MIGHT be the issue.
// I'll assume `jsonwebtoken` is installed as dependency of `@nestjs/jwt`.

async function run() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/MONGODB_URI=(.+)/);
        const secretMatch = envContent.match(/JWT_SECRET=(.+)/);

        if (!match) {
            console.error('Could not find MONGODB_URI in .env');
            return;
        }

        const uri = match[1].trim();
        const jwtSecret = secretMatch ? secretMatch[1].trim() : 'secret';

        console.log('Connecting to DB...');
        await mongoose.connect(uri);

        const email = 'manindraachanta@gmail.com';
        console.log(`Searching for user: ${email}`);

        const user = await mongoose.connection.collection('users').findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User found:', user._id);
        console.log('Role:', user.role);

        // Simulate validateUser toObject logic
        // In raw mongoose driver, we get POJO directly.
        // So user IS a POJO.

        console.log('Simulating login...');

        // 1. Payload
        const payload = { email: user.email, sub: user._id.toString(), role: user.role };
        console.log('Payload created:', payload);

        // 2. Driver lookup if driver
        if (user.role === 'driver') {
            console.log('User is driver, looking up driver profile...');
            const driver = await mongoose.connection.collection('drivers').findOne({ userId: user._id });
            if (driver) {
                console.log('Driver profile found:', driver._id);
            } else {
                console.log('Driver profile NOT found');
            }
        } else {
            console.log('User is NOT driver, skipping driver lookup');
        }

        // 3. JWT Sign
        try {
            // We use simple jsonwebtoken here to verify if it works conceptually
            // If this script fails because module not found, I'll know.
            // But main code uses @nestjs/jwt which wraps this.
            // If payload has circular structure, it throws.
            const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
            console.log('JWT Signed successfully. Token length:', token.length);
        } catch (jwtErr) {
            console.error('JWT Sign Error:', jwtErr);
        }

        console.log('Login simulation completed successfully.');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
