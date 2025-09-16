require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@school.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      await mongoose.disconnect();
      return;
    }

    // Create admin user with password that meets validation criteria
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@school.com',
      password: 'Admin123', // Meets validation: uppercase, lowercase, digit
      role: 'admin',
      phone: '+1234567890',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'other',
      address: {
        street: '123 School Street',
        city: 'Education City',
        state: 'Learning State',
        postalCode: '12345',
        country: 'Knowledge Country'
      },
      isActive: true
    });

    const savedUser = await adminUser.save();
    console.log('Test admin user created successfully!');
    console.log('Email: admin@school.com');
    console.log('Password: Admin123');
    console.log('User ID:', savedUser._id);

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();