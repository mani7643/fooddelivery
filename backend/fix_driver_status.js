import 'dotenv/config'; // Auto-load .env
import mongoose from 'mongoose';
import Driver from './models/Driver.js';

const fixDrivers = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.error('No MONGO_URI found in environment!');
            process.exit(1);
        }

        console.log('Connecting to DB...');
        await mongoose.connect(uri);
        console.log('Connected!');

        // Find drivers in 'pending_documents'
        const allDrivers = await Driver.find({});
        console.log(`Found ${allDrivers.length} total drivers.`);
        allDrivers.forEach(d => {
            console.log(`ID: ${d._id} | Name: ${d.name} | Status: ${d.verificationStatus}`);
        });

        // const result = await Driver.updateMany(
        //     { verificationStatus: 'pending_documents' },
        //     { $set: { verificationStatus: 'pending_verification' } }
        // );

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixDrivers();
