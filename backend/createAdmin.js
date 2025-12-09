import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create admin user
        const adminData = {
            email: 'admin@courier.com',
            password: 'Admin@123',  // Change this to a secure password
            name: 'Admin User',
            phone: '+91 9999999999',
            role: 'admin'
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);

            // Update role to admin if not already
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin role');
            }
        } else {
            const admin = await User.create(adminData);
            console.log('✅ Admin user created successfully!');
            console.log('Email:', admin.email);
            console.log('Password: Admin@123');
            console.log('Role:', admin.role);
        }

        console.log('\n🎉 You can now login with:');
        console.log('Email: admin@courier.com');
        console.log('Password: Admin@123');
        console.log('\nThen navigate to: http://localhost:5173/admin');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createAdminUser();
