import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Driver from './models/Driver.js';
import User from './models/User.js';

dotenv.config();

console.log('Mongo URI:', process.env.MONGO_URI ? 'Defined' : 'Undefined');

const checkDrivers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const drivers = await Driver.find({}).populate('userId', 'name email');

        console.log('\n--- ALL DRIVERS STATUS ---');
        console.log('Total Drivers:', drivers.length);

        drivers.forEach(d => {
            console.log(`\nDriver: ${d.userId?.name || 'Unknown'} (${d.userId?.email})`);
            console.log(`  ID: ${d._id}`);
            console.log(`  Verification Status: ${d.verificationStatus}`);
            console.log(`  Is Available (Online): ${d.isAvailable}`);

            const isOnlineCalculated = d.verificationStatus === 'verified' && d.isAvailable === true;
            console.log(`  -> Counted as Online? ${isOnlineCalculated ? 'YES' : 'NO'}`);
        });

        const onlineCount = await Driver.countDocuments({ verificationStatus: 'verified', isAvailable: true });
        console.log(`\n\nTotal "Online" Count in DB: ${onlineCount}`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkDrivers();
