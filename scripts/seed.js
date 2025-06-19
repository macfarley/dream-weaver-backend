/**
 * =============================================================================
 * DATABASE SEEDING SCRIPT - DreamWeaver Backend
 * =============================================================================
 * 
 * This script generates comprehensive test data for the DreamWeaver application,
 * including test users, bedroom configurations, and sleep data entries. 
 * It's designed to populate the database with realistic sample data for 
 * development, testing, and demonstration purposes.
 * 
 * Key Features:
 * - Creates multiple test users with realistic profiles
 * - Finds existing admin user and generates data for them
 * - Generates diverse bedroom configurations with realistic settings
 * - Creates 30 days of historical sleep data with random patterns
 * - Includes realistic wake-up events and quality ratings
 * - Uses faker library for diverse, realistic text content
 * - Comprehensive error handling and data validation
 * 
 * Data Generated:
 * - 3 test users (if they don't already exist)
 * - Multiple bedroom configurations per user (admin + test users)
 * - Historical sleep sessions spanning the last month for each user
 * - Random wake-up patterns with quality ratings (1-10)
 * - Dream journal entries with realistic content
 * - Various cuddle buddy preferences and sleep thoughts
 * 
 * Usage:
 * - Set ADMIN_USERNAME environment variable (defaults to 'admin')
 * - Run from project root: `npm run seed` or `node scripts/seed.js`
 * - Requires valid MONGODB_URI in environment variables
 * 
 * Security Considerations:
 * - Creates test users with simple passwords (password123)
 * - Only safe for development and staging environments
 * - Cleans existing test data before seeding
 * - Does not modify existing user accounts or administrative settings
 * 
 * @author DreamWeaver Development Team
 * @version 2.0.0
 * =============================================================================
 */

// Environment configuration and third-party dependencies
require('dotenv').config();              // Load environment variables
const mongoose = require('mongoose');    // MongoDB object modeling
const { faker } = require('@faker-js/faker'); // Realistic fake data generation

// Application data models
const User = require('../models/User');
const Bedroom = require('../models/Bedroom');
const SleepData = require('../models/SleepData');
const bcrypt = require('bcrypt');

// Configuration from environment variables
const MONGO_URL = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

// Seeding configuration constants
const SLEEP_DATA_ENTRIES_COUNT = 30;    // Number of sleep sessions to generate per user
const DAYS_OF_HISTORY = 30;             // Days back from current date
const MAX_WAKEUPS_PER_SESSION = 3;      // Maximum wake-ups per sleep session
const SALT_ROUNDS = 12;                 // bcrypt salt rounds for password hashing

/**
 * =============================================================================
 * ENVIRONMENT VALIDATION
 * =============================================================================
 * Validates that all required environment variables are properly configured
 * before attempting to seed the database.
 * =============================================================================
 */
if (!MONGO_URL) {
  console.error('❌ ERROR: MONGODB_URI not set in environment variables');
  console.error('💡 Please add MONGODB_URI to your .env file');
  process.exit(1);
}

/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 * Helper functions for generating realistic test data with proper date
 * distribution and realistic sleep patterns.
 * =============================================================================
 */

/**
 * Creates test users if they don't already exist
 * @returns {Array} Array of created user objects
 */
async function createTestUsers() {
  const testUsers = [
    {
      username: 'dreamtester1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@test.com',
      password: 'password123',
      role: 'user'
    },
    {
      username: 'dreamtester2', 
      firstName: 'Mike',
      lastName: 'Chen',
      email: 'mike.chen@test.com',
      password: 'password123',
      role: 'user'
    },
    {
      username: 'sleepyuser',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@test.com',
      password: 'password123',
      role: 'user'
    }
  ];

  const createdUsers = [];
  
  for (const userData of testUsers) {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: userData.username },
        { email: userData.email }
      ]
    });
    
    if (!existingUser) {
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
      const newUser = new User({
        ...userData,
        hashedPassword,
        dateOfBirth: faker.date.between({ from: '1980-01-01', to: '2000-12-31' }),
        joinedAt: new Date()
      });
      
      await newUser.save();
      createdUsers.push(newUser);
      console.log(`   ✅ Created user: ${newUser.username} (${newUser.firstName} ${newUser.lastName})`);
    } else {
      console.log(`   ⏭️  User ${userData.username} already exists, skipping`);
      createdUsers.push(existingUser);
    }
  }
  
  return createdUsers;
}

/**
 * Creates bedrooms for a specific user
 * @param {string} userId - User ID to create bedrooms for
 * @param {string} username - Username for logging
 * @returns {Array} Array of created bedroom objects
 */
async function createBedrooms(userId, username) {
  const bedroomsData = [
    {
      ownerId: userId,
      bedroomName: `${username}'s Master Bedroom`,
      description: 'Primary bedroom with optimal sleep conditions',
      bedType: 'bed',
      mattressType: 'memory foam',
      bedSize: 'queen',
      temperature: 70,
      lightLevel: 'dim',
      noiseLevel: 'quiet',
      pillows: 'two',
      notes: 'Main bedroom with blackout curtains and white noise machine'
    },
    {
      ownerId: userId,
      bedroomName: `${username}'s Reading Nook`,
      description: 'Cozy space for afternoon naps',
      bedType: 'couch',
      mattressType: null,
      bedSize: null,
      temperature: 72,
      lightLevel: 'moderate',
      noiseLevel: 'quiet',
      pillows: 'one',
      notes: 'Comfortable reading space that doubles as napping area'
    },
    {
      ownerId: userId,
      bedroomName: `${username}'s Guest Room`,
      description: 'Comfortable space for guests or variety',
      bedType: 'bed',
      mattressType: 'spring',
      bedSize: 'full',
      temperature: 68,
      lightLevel: 'very dim',
      noiseLevel: 'very quiet',
      pillows: 'three',
      notes: 'Quiet guest room with excellent temperature control'
    }
  ];

  const bedrooms = await Bedroom.insertMany(bedroomsData);
  console.log(`   ✅ Created ${bedrooms.length} bedrooms for ${username}`);
  return bedrooms;
}

/**
 * Generates a random date within the specified number of days from now.
 * Used to create realistic historical sleep data distribution.
 * 
 * @param {number} daysBack - Number of days back from current date
 * @returns {Date} Random date within the specified range
 */
function randomDateWithinLastMonth(daysBack = DAYS_OF_HISTORY) {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - daysBack);
  
  // Generate random timestamp between past and now
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

/**
 * Generates realistic wake-up events for a sleep session.
 * Creates 1-3 wake-ups with progressive timestamps and quality ratings.
 * 
 * @param {Date} sessionStart - When the sleep session began
 * @returns {Array} Array of wake-up event objects
 */
function generateWakeUps(sessionStart) {
  const wakeUpCount = Math.floor(Math.random() * MAX_WAKEUPS_PER_SESSION) + 1; // 1-3 wake-ups
  const wakeUps = [];
  let lastEventTime = sessionStart;
  
  for (let i = 0; i < wakeUpCount; i++) {
    // Generate sleep quality rating (1-10, with bias toward middle-high range)
    const sleepQuality = Math.floor(Math.random() * 10) + 1;
    
    // Generate realistic dream journal content
    const dreamJournal = faker.lorem.sentence({ min: 5, max: 15 });
    
    // Calculate wake-up time (0.5 to 4 hours after last event)
    const hoursLater = 0.5 + Math.random() * 3.5; // 0.5-4 hours
    const awakenAt = new Date(lastEventTime.getTime() + (hoursLater * 60 * 60 * 1000));
    
    // Determine if this is the final wake-up (last iteration)
    const finishedSleeping = i === wakeUpCount - 1;
    
    // Calculate back-to-bed time if not the final wake-up
    let backToBedAt = null;
    if (!finishedSleeping) {
      // 5-45 minutes after waking up
      const minutesAwake = 5 + Math.random() * 40;
      backToBedAt = new Date(awakenAt.getTime() + (minutesAwake * 60 * 1000));
    }
    
    wakeUps.push({
      sleepQuality,
      dreamJournal,
      awakenAt,
      finishedSleeping,
      backToBedAt
    });
    
    // Update last event time for next iteration
    lastEventTime = backToBedAt || awakenAt;
  }
  
  return wakeUps;
}

/**
 * =============================================================================
 * MAIN SEEDING FUNCTION
 * =============================================================================
 * Orchestrates the complete database seeding process with comprehensive
 * error handling, user validation, and data generation.
 * =============================================================================
 */
async function seed() {
  try {
    console.log('🚀 DreamWeaver Database Seeding Script');
    console.log('='.repeat(50));
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log(`🎯 Admin Username: ${ADMIN_USERNAME}`);
    console.log(`📊 Generating ${SLEEP_DATA_ENTRIES_COUNT} sleep entries per user`);
    console.log('='.repeat(50));
    
    // Step 1: Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Successfully connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    // Step 2: Find or validate admin user
    console.log(`� Finding admin user: ${ADMIN_USERNAME}`);
    const adminUser = await User.findOne({ username: ADMIN_USERNAME });
    if (!adminUser) {
      throw new Error(`Admin user '${ADMIN_USERNAME}' not found. Please create admin user first.`);
    }
    console.log(`✅ Admin user found: ${adminUser.username} (${adminUser.firstName} ${adminUser.lastName})`);

    // Step 3: Create test users
    console.log('👥 Creating test users...');
    const testUsers = await createTestUsers();
    
    // Step 4: Combine all users for seeding (admin + test users)
    const allUsers = [adminUser, ...testUsers.filter(user => user._id.toString() !== adminUser._id.toString())];
    console.log(`✅ Total users to seed data for: ${allUsers.length}`);

    // Step 5: Clean existing test data
    console.log('🧹 Cleaning existing seed data...');
    const userIds = allUsers.map(user => user._id);
    const deletedBedrooms = await Bedroom.deleteMany({ ownerId: { $in: userIds } });
    const deletedSleepData = await SleepData.deleteMany({ user: { $in: userIds } });
    console.log(`   Removed ${deletedBedrooms.deletedCount} existing bedrooms`);
    console.log(`   Removed ${deletedSleepData.deletedCount} existing sleep entries`);

    // Step 6: Create bedrooms and sleep data for each user
    let totalSleepEntries = 0;
    let totalBedrooms = 0;
    
    for (const user of allUsers) {
      console.log(`\n🏠 Creating data for user: ${user.username}`);
      
      // Create bedrooms for this user
      const bedrooms = await createBedrooms(user._id, user.username);
      totalBedrooms += bedrooms.length;
      
      // Generate sleep data for this user
      console.log(`   💤 Generating ${SLEEP_DATA_ENTRIES_COUNT} sleep sessions...`);
      
      const cuddleBuddyOptions = ['none', 'pillow', 'stuffed animal', 'pet', 'person'];
      const sleepDataEntries = [];
      
      for (let i = 0; i < SLEEP_DATA_ENTRIES_COUNT; i++) {
        const createdAt = randomDateWithinLastMonth();
        const bedroom = bedrooms[Math.floor(Math.random() * bedrooms.length)];
        
        const sleepThoughts = [
          faker.lorem.sentences(2),
          'Feeling grateful for today. Ready for peaceful sleep.',
          'Thinking about tomorrow\'s plans. Hope for good dreams.',
          'A bit restless tonight. Need to clear my mind.',
          'Cozy and comfortable. Perfect evening for sleep.',
          'Reviewing the day\'s highlights. Time to rest.',
          faker.lorem.sentence({ min: 8, max: 20 })
        ];
        
        sleepDataEntries.push({
          user: user._id,
          bedroom: bedroom._id,
          cuddleBuddy: cuddleBuddyOptions[Math.floor(Math.random() * cuddleBuddyOptions.length)],
          sleepyThoughts: sleepThoughts[Math.floor(Math.random() * sleepThoughts.length)],
          wakeUps: generateWakeUps(createdAt),
          createdAt
        });
      }
      
      // Save sleep data for this user
      const savedSleepData = await SleepData.insertMany(sleepDataEntries);
      totalSleepEntries += savedSleepData.length;
      console.log(`   ✅ Created ${savedSleepData.length} sleep sessions for ${user.username}`);
    }

    // Step 7: Generate summary statistics
    console.log('\n📊 SEEDING SUMMARY');
    console.log('='.repeat(40));
    
    const allSleepData = await SleepData.find({ user: { $in: userIds } });
    const totalWakeUps = allSleepData.reduce((total, entry) => total + entry.wakeUps.length, 0);
    const averageWakeUps = (totalWakeUps / allSleepData.length).toFixed(1);
    const dateRange = {
      earliest: new Date(Math.min(...allSleepData.map(entry => entry.createdAt))),
      latest: new Date(Math.max(...allSleepData.map(entry => entry.createdAt)))
    };
    
    console.log(`� Admin user: ${adminUser.username}`);
    console.log(`👥 Test users created: ${testUsers.length}`);
    console.log(`🏠 Total bedrooms: ${totalBedrooms}`);
    console.log(`💤 Total sleep sessions: ${totalSleepEntries}`);
    console.log(`⏰ Total wake-ups: ${totalWakeUps}`);
    console.log(`📈 Average wake-ups per session: ${averageWakeUps}`);
    console.log(`📅 Date range: ${dateRange.earliest.toLocaleDateString()} to ${dateRange.latest.toLocaleDateString()}`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('💡 You can now test CRUD operations with realistic data');
    console.log('🔧 Test user credentials: username/password123');

  } catch (error) {
    console.error('\n💥 SEEDING FAILED!');
    console.error('='.repeat(30));
    console.error('❌ Error:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('📋 Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`   • ${err.message}`);
      });
    } else if (error.name === 'MongoNetworkError') {
      console.error('🌐 Network error - check MongoDB connection');
    } else if (error.code === 11000) {
      console.error('🔑 Duplicate key error - data conflicts detected');
    }
    
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('   • Verify MONGODB_URI is correct');
    console.error('   • Check ADMIN_USERNAME exists in database');
    console.error('   • Ensure database is accessible');
    console.error('   • Review error details above');
    
    throw error;
  }
}

/**
 * =============================================================================
 * SCRIPT EXECUTION
 * =============================================================================
 * Main script execution with comprehensive error handling and cleanup.
 * =============================================================================
 */
seed()
  .catch(error => {
    console.error('\n💥 CRITICAL ERROR DURING SEEDING:');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  })
  .finally(() => {
    // Ensure database connection is properly closed
    if (mongoose.connection.readyState === 1) {
      mongoose.disconnect();
      console.log('\n🔌 Database connection closed');
    }
    
    console.log('⏰ Script completed:', new Date().toISOString());
    console.log('='.repeat(50));
  });
