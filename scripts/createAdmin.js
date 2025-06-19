/**
 * =============================================================================
 * CREATE ADMIN SCRIPT - DreamWeaver Backend
 * =============================================================================
 * 
 * This script creates an administrative user account for the DreamWeaver
 * application. It's designed to be run once during initial setup or when
 * an admin account needs to be created.
 * 
 * Features:
 * - Creates admin user with predefined secure credentials
 * - Sets up initial admin bedroom configuration
 * - Checks for existing admin accounts to prevent duplicates
 * - Comprehensive error handling and logging
 * - Database connection management
 * 
 * Usage:
 * - Run from project root: `node scripts/createAdmin.js`
 * - Requires valid MONGODB_URI in environment variables
 * - Should be run in a secure environment only
 * 
 * Security Considerations:
 * - Uses strong password hashing with bcrypt
 * - High salt rounds for password security
 * - Admin role can only be set during account creation
 * - Connection cleanup after execution
 * 
 * @author DreamWeaver Development Team
 * @version 1.0.0
 * =============================================================================
 */

// Core Node.js and third-party dependencies
const mongoose = require('mongoose');    // MongoDB object modeling
const bcrypt = require('bcrypt');        // Password hashing
require('dotenv').config();              // Environment variable loading

// Application data models
const User = require('../models/User');
const Bedroom = require('../models/Bedroom');

// Configuration constants
const SALT_ROUNDS = 12; // High security salt rounds for password hashing
const ADMIN_CREDENTIALS = {
  username: 'dreamadmin',
  email: 'admin@dreamweaver.com',
  password: 'DreamAdmin2025!',
  firstName: 'Dream',
  lastName: 'Administrator',
  dateOfBirth: new Date('1990-01-01'),
  role: 'admin'
};

/**
 * =============================================================================
 * DATABASE CONNECTION FUNCTION
 * =============================================================================
 * Establishes connection to MongoDB database using environment configuration.
 * Includes comprehensive error handling and connection validation.
 * =============================================================================
 */
const connectDB = async () => {
  try {
    // Validate that MongoDB URI is configured
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not configured');
    }

    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB with recommended options
    await mongoose.connect(process.env.MONGODB_URI, {
      // Ensure we're using the new connection string parser
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Please check your MONGODB_URI environment variable');
    process.exit(1);
  }
};

/**
 * =============================================================================
 * ADMIN USER CREATION FUNCTION
 * =============================================================================
 * Creates an administrative user account with secure password hashing and
 * associated bedroom configuration. Includes duplicate checking and validation.
 * =============================================================================
 */
const createAdminUser = async () => {
  try {
    console.log('👤 Creating admin user account...');
    
    // Check if an admin user already exists with the same username or email
    const existingAdmin = await User.findOne({
      $or: [
        { username: ADMIN_CREDENTIALS.username },
        { email: ADMIN_CREDENTIALS.email }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Username: ${existingAdmin.username}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log('💡 Use existing credentials to log in as admin');
      return existingAdmin;
    }

    console.log('🔐 Hashing admin password with high security settings...');
    
    // Hash password with high salt rounds for maximum security
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, SALT_ROUNDS);
    
    console.log('📝 Creating admin user document...');
    
    // Create new admin user with validated data
    const adminUser = new User({
      username: ADMIN_CREDENTIALS.username,
      firstName: ADMIN_CREDENTIALS.firstName,
      lastName: ADMIN_CREDENTIALS.lastName,
      dateOfBirth: ADMIN_CREDENTIALS.dateOfBirth,
      email: ADMIN_CREDENTIALS.email.toLowerCase(), // Normalize email
      hashedPassword: hashedPassword,
      role: ADMIN_CREDENTIALS.role, // Admin role can only be set during creation
      joinedAt: new Date(),
      userPreferences: {
        theme: 'light',
        notifications: true,
        sleepGoals: {
          bedtime: '22:00',
          wakeTime: '07:00',
          minimumSleep: 8
        }
      }
    });

    // Save admin user to database
    const savedAdminUser = await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log(`🆔 User ID: ${savedAdminUser._id}`);

    return savedAdminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      console.error('📋 Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`   • ${err.message}`);
      });
    } else if (error.code === 11000) {
      console.error('📧 Email or username already exists in database');
    }
    
    throw error;
  }
};

/**
 * =============================================================================
 * ADMIN BEDROOM CREATION FUNCTION
 * =============================================================================
 * Creates an initial bedroom configuration for the admin user to enable
 * immediate sleep tracking functionality.
 * =============================================================================
 */
const createAdminBedroom = async (adminUser) => {
  try {
    console.log('🏠 Creating admin bedroom configuration...');
    
    // Check if admin already has bedrooms
    const existingBedrooms = await Bedroom.find({ ownerId: adminUser._id });
    
    if (existingBedrooms.length > 0) {
      console.log(`⚠️  Admin already has ${existingBedrooms.length} bedroom(s) configured`);
      console.log('🏠 Existing bedrooms:');
      existingBedrooms.forEach((bedroom, index) => {
        console.log(`   ${index + 1}. ${bedroom.bedroomName}`);
      });
      return existingBedrooms[0]; // Return first existing bedroom
    }

    // Create admin bedroom with comprehensive initial settings
    const adminBedroom = new Bedroom({
      ownerId: adminUser._id,
      bedroomName: 'Admin Suite',
      description: 'Default administrative bedroom for system testing and demo purposes',
      lightLevel: 'dim',
      noiseLevel: 'quiet',
      temperature: 72, // Fahrenheit
      notes: 'Created during admin account setup - modify as needed'
    });

    const savedBedroom = await adminBedroom.save();
    console.log('✅ Admin bedroom created successfully!');
    console.log(`🆔 Bedroom ID: ${savedBedroom._id}`);
    console.log(`🏠 Bedroom Name: ${savedBedroom.bedroomName}`);

    return savedBedroom;

  } catch (error) {
    console.error('❌ Error creating admin bedroom:', error.message);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      console.error('� Bedroom validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`   • ${err.message}`);
      });
    }
    
    throw error;
  }
};

/**
 * =============================================================================
 * MAIN EXECUTION FUNCTION
 * =============================================================================
 * Orchestrates the admin account creation process with comprehensive error
 * handling and user feedback.
 * =============================================================================
 */
const main = async () => {
  console.log('🚀 DreamWeaver Admin User Creation Script');
  console.log('='.repeat(50));
  console.log('📅 Started:', new Date().toISOString());
  console.log('='.repeat(50));
  
  try {
    // Step 1: Connect to database
    await connectDB();
    
    // Step 2: Create admin user
    const adminUser = await createAdminUser();
    
    // Step 3: Create admin bedroom (only if user was newly created)
    let adminBedroom = null;
    if (adminUser) {
      adminBedroom = await createAdminBedroom(adminUser);
    }
    
    // Step 4: Display success information
    console.log('\n🎉 ADMIN SETUP COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('📋 ADMIN LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log(`👤 Username: ${ADMIN_CREDENTIALS.username}`);
    console.log(`🔑 Password: ${ADMIN_CREDENTIALS.password}`);
    console.log(`📧 Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`🔐 Role: ${ADMIN_CREDENTIALS.role}`);
    console.log('='.repeat(60));
    
    if (adminBedroom) {
      console.log('🏠 DEFAULT BEDROOM CREATED:');
      console.log(`   Name: ${adminBedroom.bedroomName}`);
      console.log(`   ID: ${adminBedroom._id}`);
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Use these credentials to log in to the admin panel');
    console.log('   2. Test admin functionality and user management');
    console.log('   3. Create additional bedrooms as needed');
    console.log('   4. Configure sleep tracking preferences');
    
    console.log('\n⚠️  SECURITY REMINDER:');
    console.log('   • Change the default admin password after first login');
    console.log('   • Keep admin credentials secure and confidential');
    console.log('   • Monitor admin access logs regularly');
    
  } catch (error) {
    console.error('\n💥 ADMIN CREATION FAILED!');
    console.error('='.repeat(40));
    console.error('❌ Error:', error.message);
    console.error('📍 Stack trace:', error.stack);
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('   • Check MongoDB connection string');
    console.error('   • Verify database permissions');
    console.error('   • Ensure no conflicting admin accounts exist');
    
    process.exit(1);
  } finally {
    // Clean up database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
    
    console.log('⏰ Script completed:', new Date().toISOString());
  }
};

// Run the script
main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
