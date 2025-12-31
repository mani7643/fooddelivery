const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');

async function run() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/MONGODB_URI=(.+)/);

        if (!match) {
            console.error('Could not find MONGODB_URI in .env');
            return;
        }

        const uri = match[1].trim();
        console.log('Connecting to DB...');
        await mongoose.connect(uri);

        const email = 'manindraachanta@gmail.com';
        console.log(`Searching for user: ${email}`);

        const user = await mongoose.connection.collection('users').findOne({ email: email.toLowerCase() });

        if (user) {
            console.log('User found:');
            console.log('ID:', user._id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Status:', user.accountStatus);

            if (user.password) {
                console.log('Password hash length:', user.password.length);
                console.log('Password starts with $:', user.password.startsWith('$'));
                console.log('Password hash prefix:', user.password.substring(0, 7));

                // Test compare
                try {
                    console.log('Testing bcrypt compare...');
                    const isMatch = await bcrypt.compare('somepassword', user.password);
                    console.log('Compare result (should be false/true, not error):', isMatch);
                } catch (bcryptErr) {
                    console.error('BCRYPT ERROR:', bcryptErr);
                }
            } else {
                console.log('Password MISSING');
            }

            if (user.accountStatus === 'pending') {
                console.log('Approving user...');
                await mongoose.connection.collection('users').updateOne({ _id: user._id }, { $set: { accountStatus: 'active' } });
                console.log('User approved!');
            }
        } else {
            console.log('User NOT found.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
