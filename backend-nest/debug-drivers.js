const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://student:student@cluster0.n186r.mongodb.net/courier';

async function checkDrivers() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const drivers = await mongoose.connection.db.collection('drivers').find({ isAvailable: true }).toArray();

        console.log(`Found ${drivers.length} online drivers:`);
        drivers.forEach(d => {
            console.log(`- Name: ${d.name}`);
            console.log(`  Status: ${d.currentStatus}`);
            console.log(`  Coords: ${JSON.stringify(d.currentLocation?.coordinates)}`);
            console.log('---');
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDrivers();
