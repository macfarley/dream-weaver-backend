/**
 * =============================================================================
 * DATABASE SEEDING SCRIPT - DreamWeaver Backend
 * =============================================================================
 * 
 * This script generates realistic test data for the DreamWeaver application,
 * including bedroom configurations and sleep data entries. It's designed to
 * populate the database with sample data for development and testing purposes.
 * 
 * Key Features:
 * - Generates diverse bedroom configurations with realistic settings
 * - Creates 30 days of historical sleep data with random patterns
 * - Includes realistic wake-up events and quality ratings
 * - Uses faker library for diverse, realistic text content
 * - Comprehensive error handling and data validation
 * 
 * Data Generated:
 * - Multiple bedroom configurations per user
 * - Historical sleep sessions spanning the last month
 * - Random wake-up patterns with quality ratings (1-10)
 * - Dream journal entries with realistic content
 * - Various cuddle buddy preferences and sleep thoughts
 * 
 * Usage:
 * - Set USER_ID environment variable to target user's MongoDB ObjectId
 * - Run from project root: `node scripts/seed.js`
 * - Requires valid MONGODB_URI in environment variables
 * 
 * Security Considerations:
 * - Only populates data for specified user ID
 * - Cleans existing test data before seeding
 * - Does not modify user accounts or administrative data
 * - Safe for development and staging environments
 * 
 * @author DreamWeaver Development Team
 * @version 1.0.0
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

// Configuration from environment variables
const MONGO_URL = process.env.MONGODB_URI;
const USER_ID = process.env.USER_ID;

// Seeding configuration constants
const SLEEP_DATA_ENTRIES_COUNT = 30;    // Number of sleep sessions to generate
const DAYS_OF_HISTORY = 30;             // Days back from current date
const MAX_WAKEUPS_PER_SESSION = 3;      // Maximum wake-ups per sleep session

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

if (!USER_ID) {
  console.error('❌ ERROR: USER_ID not set in environment variables');
  console.error('💡 Please add USER_ID (MongoDB ObjectId) to your .env file');
  console.error('💡 Example: USER_ID=507f1f77bcf86cd799439011');
  process.exit(1);
}

// Validate USER_ID format
if (!USER_ID.match(/^[0-9a-fA-F]{24}$/)) {
  console.error('❌ ERROR: USER_ID must be a valid MongoDB ObjectId (24 hex characters)');
  console.error(`💡 Current value: ${USER_ID}`);
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
    console.log(`🎯 Target User ID: ${USER_ID}`);
    console.log(`📊 Generating ${SLEEP_DATA_ENTRIES_COUNT} sleep entries`);
    console.log('='.repeat(50));
    
    // Step 1: Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Successfully connected to MongoDB');
    console.log(`📍 Database: ${mongoose.connection.name}`);

    // Step 2: Validate target user exists
    console.log(`👤 Validating user exists: ${USER_ID}`);
    const user = await User.findById(USER_ID);
    if (!user) {
      throw new Error(`User with ID ${USER_ID} not found in database`);
    }
    console.log(`✅ User found: ${user.username} (${user.firstName} ${user.lastName})`);

    // Step 3: Clean existing test data for user
    console.log('🧹 Cleaning existing test data...');
    const deletedBedrooms = await Bedroom.deleteMany({ ownerId: USER_ID });
    const deletedSleepData = await SleepData.deleteMany({ user: USER_ID });
    console.log(`   Removed ${deletedBedrooms.deletedCount} existing bedrooms`);
    console.log(`   Removed ${deletedSleepData.deletedCount} existing sleep entries`);

    // Step 4: Create sample bedrooms with diverse configurations
    console.log('🏠 Creating sample bedrooms...');
    const bedroomsData = [
      {
        ownerId: USER_ID,
        bedroomName: 'Cozy Nest',
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
        ownerId: USER_ID,
        bedroomName: 'Dream Den',
        description: 'Secondary sleeping space for variety',
        bedType: 'futon',
        mattressType: null,  // Not required for futon
        bedSize: null,       // Not applicable for futon
        temperature: 68,
        lightLevel: 'very dim',
        noiseLevel: 'very quiet',
        pillows: 'one',
        notes: 'Quiet reading nook that doubles as sleeping space'
      },
      {
        ownerId: USER_ID,
        bedroomName: 'Guest Haven',
        description: 'Comfortable guest bedroom setup',
        bedType: 'bed',
        mattressType: 'spring',
        bedSize: 'full',
        temperature: 72,
        lightLevel: 'normal',
        noiseLevel: 'moderate',
        pillows: 'three',
        notes: 'Guest room with adjustable lighting and temperature'
      }
    ];

    const bedrooms = await Bedroom.insertMany(bedroomsData);
    console.log(`✅ Created ${bedrooms.length} bedrooms:`);
    bedrooms.forEach((bedroom, index) => {
      console.log(`   ${index + 1}. ${bedroom.bedroomName} (ID: ${bedroom._id})`);
    });

    // Step 5: Generate realistic sleep data entries
    console.log(`💤 Generating ${SLEEP_DATA_ENTRIES_COUNT} sleep data entries...`);
    
    // Possible cuddle buddy options (must match schema enum)
    const cuddleBuddyOptions = ['none', 'pillow', 'stuffed animal', 'pet', 'person'];
    
    const sleepDataEntries = [];
    
    for (let i = 0; i < SLEEP_DATA_ENTRIES_COUNT; i++) {
      // Generate random creation date within the last month
      const createdAt = randomDateWithinLastMonth();
      
      // Randomly select a bedroom for this sleep session
      const bedroom = bedrooms[Math.floor(Math.random() * bedrooms.length)];
      
      // Generate varied sleep thoughts
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
        user: USER_ID,
        bedroom: bedroom._id,
        cuddleBuddy: cuddleBuddyOptions[Math.floor(Math.random() * cuddleBuddyOptions.length)],
        sleepyThoughts: sleepThoughts[Math.floor(Math.random() * sleepThoughts.length)],
        wakeUps: generateWakeUps(createdAt),
        createdAt
      });
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`   Generated ${i + 1}/${SLEEP_DATA_ENTRIES_COUNT} entries...`);
      }
    }

    // Step 6: Insert sleep data into database
    console.log('💾 Saving sleep data to database...');
    const savedSleepData = await SleepData.insertMany(sleepDataEntries);
    console.log(`✅ Successfully created ${savedSleepData.length} sleep data entries`);

    // Step 7: Generate summary statistics
    console.log('\n📊 SEEDING SUMMARY');
    console.log('='.repeat(40));
    
    // Calculate some statistics
    const totalWakeUps = savedSleepData.reduce((total, entry) => total + entry.wakeUps.length, 0);
    const averageWakeUps = (totalWakeUps / savedSleepData.length).toFixed(1);
    const dateRange = {
      earliest: new Date(Math.min(...savedSleepData.map(entry => entry.createdAt))),
      latest: new Date(Math.max(...savedSleepData.map(entry => entry.createdAt)))
    };
    
    console.log(`👤 User: ${user.username}`);
    console.log(`🏠 Bedrooms created: ${bedrooms.length}`);
    console.log(`💤 Sleep sessions: ${savedSleepData.length}`);
    console.log(`⏰ Total wake-ups: ${totalWakeUps}`);
    console.log(`📈 Average wake-ups per session: ${averageWakeUps}`);
    console.log(`📅 Date range: ${dateRange.earliest.toLocaleDateString()} to ${dateRange.latest.toLocaleDateString()}`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('💡 You can now test the application with realistic data');

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
    console.error('   • Check USER_ID exists in database');
    console.error('   • Ensure database is accessible');
    console.error('   • Review error details above');
    
    throw error; // Re-throw to trigger finally block
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
