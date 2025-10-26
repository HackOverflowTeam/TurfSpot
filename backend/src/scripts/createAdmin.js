const User = require('../models/User.model');
const connectDB = require('../config/database');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@turfspot.com';
    const adminPassword = 'admin123456'; // Change this!

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      process.exit(1);
    }

    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      name: 'Admin',
      phone: '9999999999',
      role: 'admin',
      isVerified: true,
      authProvider: 'email'
    });

    console.log('✅ Admin user created successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
