require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

const DriverSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: String,
    verificationNotes: String
}, { strict: false });

const UserSchema = new Schema({
    email: String,
    name: String
}, { strict: false });

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Missing MONGODB_URI');
        return;
    }

    try {
        console.log('Connecting to DB...');
        await mongoose.connect(uri);

        const Driver = mongoose.model('Driver', DriverSchema);
        const User = mongoose.model('User', UserSchema);

        const drivers = await Driver.find().populate('userId', 'name email');

        console.log('--- Drivers Status ---');
        drivers.forEach(d => {
            const email = d.userId ? d.userId.email : 'UNKNOWN';
            console.log(`Driver: ${email}`);
            console.log(`Status: ${d.verificationStatus}`);
            console.log(`Notes:  ${d.verificationNotes || 'N/A'}`);
            console.log('-------------------------');
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
