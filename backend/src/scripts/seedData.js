const mongoose = require('mongoose');
const User = require('../models/User.model');
const Turf = require('../models/Turf.model');
const Booking = require('../models/Booking.model');
const connectDB = require('../config/database');
require('dotenv').config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Turf.deleteMany({});
    await Booking.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create users
    const users = await User.create([
      {
        email: 'admin@turfspot.com',
        password: 'admin123456',
        name: 'Admin User',
        phone: '9999999999',
        role: 'admin',
        isVerified: true,
        authProvider: 'email'
      },
      {
        email: 'owner1@example.com',
        password: 'password123',
        name: 'John Owner',
        phone: '9876543210',
        role: 'owner',
        isVerified: true,
        authProvider: 'email'
      },
      {
        email: 'user1@example.com',
        password: 'password123',
        name: 'Jane Player',
        phone: '9876543211',
        role: 'user',
        isVerified: true,
        authProvider: 'email'
      }
    ]);

    console.log('✅ Created users');

    // Create turfs
    const turfs = await Turf.create([
      {
        owner: users[1]._id,
        name: 'Cricket Arena Mumbai',
        description: 'Premium cricket turf with international standards',
        address: {
          street: '123 Sports Complex Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          landmark: 'Near Central Mall'
        },
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760] // Mumbai coordinates
        },
        contactInfo: {
          phone: '9876543210',
          email: 'cricket@arena.com'
        },
        sportsSupported: ['cricket'],
        pricing: {
          hourlyRate: 1500,
          weekendRate: 2000,
          currency: 'INR'
        },
        images: [
          {
            url: 'https://example.com/turf1.jpg',
            isPrimary: true
          }
        ],
        amenities: ['parking', 'floodlights', 'washroom', 'changing_room', 'drinking_water'],
        operatingHours: {
          monday: { open: '06:00', close: '22:00', isOpen: true },
          tuesday: { open: '06:00', close: '22:00', isOpen: true },
          wednesday: { open: '06:00', close: '22:00', isOpen: true },
          thursday: { open: '06:00', close: '22:00', isOpen: true },
          friday: { open: '06:00', close: '22:00', isOpen: true },
          saturday: { open: '06:00', close: '23:00', isOpen: true },
          sunday: { open: '06:00', close: '23:00', isOpen: true }
        },
        slotDuration: 60,
        status: 'approved',
        approvalInfo: {
          approvedBy: users[0]._id,
          approvedAt: new Date()
        },
        isActive: true
      },
      {
        owner: users[1]._id,
        name: 'Football Ground Delhi',
        description: 'Professional football turf with synthetic grass',
        address: {
          street: '456 Stadium Lane',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          landmark: 'Behind City Stadium'
        },
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // Delhi coordinates
        },
        contactInfo: {
          phone: '9876543211',
          email: 'football@ground.com'
        },
        sportsSupported: ['football'],
        pricing: {
          hourlyRate: 1200,
          weekendRate: 1500,
          currency: 'INR'
        },
        images: [
          {
            url: 'https://example.com/turf2.jpg',
            isPrimary: true
          }
        ],
        amenities: ['parking', 'floodlights', 'washroom', 'seating_area'],
        operatingHours: {
          monday: { open: '06:00', close: '22:00', isOpen: true },
          tuesday: { open: '06:00', close: '22:00', isOpen: true },
          wednesday: { open: '06:00', close: '22:00', isOpen: true },
          thursday: { open: '06:00', close: '22:00', isOpen: true },
          friday: { open: '06:00', close: '22:00', isOpen: true },
          saturday: { open: '06:00', close: '23:00', isOpen: true },
          sunday: { open: '06:00', close: '23:00', isOpen: true }
        },
        slotDuration: 60,
        status: 'approved',
        approvalInfo: {
          approvedBy: users[0]._id,
          approvedAt: new Date()
        },
        isActive: true
      }
    ]);

    console.log('✅ Created turfs');

    console.log('\n📊 Seed Data Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Turfs: ${turfs.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@turfspot.com / admin123456');
    console.log('   Owner: owner1@example.com / password123');
    console.log('   User: user1@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
