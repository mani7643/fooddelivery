import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Driver from './models/Driver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/courier-platform');
        console.log('MongoDB Connected');

        const drivers = await Driver.find({});
        console.log('--- ALL DRIVERS ---');
        drivers.forEach(d => {
            console.log(`Name: ${d.name}, Status: ${d.verificationStatus}, Docs: ${JSON.stringify(d.documents || {})}`);
        });
        console.log('-------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
