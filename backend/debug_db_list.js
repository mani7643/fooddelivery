import mongoose from 'mongoose';

const listDBs = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/admin');
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const list = await admin.listDatabases();
        const dbs = list.databases;

        console.log('--- START DEBUG SCAN ---');
        for (const dbInfo of dbs) {
            console.log(`\nChecking DB: ${dbInfo.name}`);
            if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;

            try {
                const db = mongoose.connection.useDb(dbInfo.name);
                const collections = await db.listCollections();

                const driverCol = collections.find(c => c.name === 'drivers');
                if (driverCol) {
                    const count = await db.collection('drivers').countDocuments();
                    console.log(`>>> FOUND 'drivers' collection with ${count} documents <<<<`);

                    if (count > 0) {
                        const docs = await db.collection('drivers').find({}).toArray();
                        docs.forEach(d => {
                            console.log(`   Driver: ${d.name} | Status: ${d.verificationStatus} | Docs: ${Object.keys(d.documents || {}).length}`);
                        });
                    }
                } else {
                    console.log(`   No 'drivers' collection found.`);
                }
            } catch (e) {
                console.log(`   Error: ${e.message}`);
            }
        }
        console.log('--- END DEBUG SCAN ---');
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
};

listDBs();
