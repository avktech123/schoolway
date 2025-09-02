const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Seed data
const seedData = async () => {
  try {
    // Check if system admin already exists
    const existingSystemAdmin = await User.findOne({ role: 'systemAdmin' });
    
    if (existingSystemAdmin) {
      console.log('System admin already exists, skipping seed');
      return;
    }
    
    // Create system admin
    const systemAdmin = new User({
      username: 'systemadmin',
      email: 'admin@schoolway.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'systemAdmin',
      phone: '+91-9876543210',
      isActive: true,
      isVerified: true,
      adminInfo: {
        permissions: [
          'manage_system',
          'manage_schools',
          'manage_all_users',
          'view_all_data'
        ],
        accessLevel: 'full'
      }
    });
    
    await systemAdmin.save();
    
    console.log('System admin created successfully!');
    console.log('Username: systemadmin');
    console.log('Password: admin123');
    console.log('Email: admin@schoolway.com');
    console.log('\nIMPORTANT: Change these credentials after first login!');
    
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run seed
seedData(); 