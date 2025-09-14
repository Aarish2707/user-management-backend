const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '+1234567890',
            password: 'password123',
            role: 'admin',
            emailVerified: true
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@example.com');
        console.log('Password: password123');

        // Create regular user
        const regularUser = new User({
            name: 'Regular User',
            email: 'user@example.com',
            phone: '+0987654321',
            password: 'password123',
            role: 'user',
            emailVerified: true
        });

        await regularUser.save();
        console.log('Regular user created successfully');
        console.log('Email: user@example.com');
        console.log('Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedAdmin();