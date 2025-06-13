require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const User = require('../models/User'); // Adjust path if needed
const Bedroom = require('../models/Bedroom');
const SleepData = require('../models/SleepData');

const MONGO_URL = process.env.MONGODB_URI;
const USER_ID = process.env.USER_ID;

if (!MONGO_URL) {
  console.error('ERROR: MONGO_URL not set in .env');
  process.exit(1);
}

if (!USER_ID) {
  console.error('ERROR: USER_ID not set in .env');
  process.exit(1);
}

function randomDateWithinLastMonth() {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 30);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function seed() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to DB');

  // Check user exists
  const user = await User.findById(USER_ID);
  if (!user) {
    console.error(`User with id ${USER_ID} not found`);
    process.exit(1);
  }

  // Clean previous data for user
  await Bedroom.deleteMany({ ownerId: USER_ID });
  await SleepData.deleteMany({ user: USER_ID });

  // Create 2 bedrooms
  const bedroomsData = [
    {
      ownerId: USER_ID,
      bedroomName: 'Cozy Nest',
      bedType: 'bed',
      mattressType: 'memory foam',
      bedSize: 'queen',
      temperature: 70,
      lightLevel: 'dim',
      noiseLevel: 'quiet',
      pillows: 'two',
    },
    {
      ownerId: USER_ID,
      bedroomName: 'Dream Den',
      bedType: 'futon',
      mattressType: null,  // not required for futon
      bedSize: null,
      temperature: 68,
      lightLevel: 'very dim',
      noiseLevel: 'very quiet',
      pillows: 'one',
    },
  ];

  const bedrooms = await Bedroom.insertMany(bedroomsData);
  console.log('Inserted bedrooms:', bedrooms.map(b => b.bedroomName));

  // Possible cuddleBuddy enums:
  const cuddleBuddyOptions = ['none', 'pillow', 'stuffed animal', 'pet', 'person'];

  // For wakeUps, generate 1-3 wakeups per SleepData
  function generateWakeUps(createdAt) {
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 wakeUps
    const wakeUps = [];
    let lastAwakenAt = createdAt;
    for (let i = 0; i < count; i++) {
      const sleepQuality = Math.floor(Math.random() * 10) + 1;
      const dreamJournal = faker.lorem.sentence();
      const awakenAt = new Date(lastAwakenAt.getTime() + Math.random() * 2 * 3600 * 1000); // +0-2 hours
      const finishedSleeping = i === count - 1;
      const backToBedAt = !finishedSleeping ? new Date(awakenAt.getTime() + Math.random() * 30 * 60000) : null; // 0-30 mins later
      wakeUps.push({
        sleepQuality,
        dreamJournal,
        awakenAt,
        finishedSleeping,
        backToBedAt,
      });
      lastAwakenAt = backToBedAt || awakenAt;
    }
    return wakeUps;
  }

  // Create ~30 SleepData entries, spread across last month
  const sleepDataEntries = [];
  for (let i = 0; i < 30; i++) {
    const createdAt = randomDateWithinLastMonth();
    const bedroom = bedrooms[Math.floor(Math.random() * bedrooms.length)];

    sleepDataEntries.push({
      user: USER_ID,
      bedroom: bedroom._id,
      cuddleBuddy: cuddleBuddyOptions[Math.floor(Math.random() * cuddleBuddyOptions.length)],
      sleepyThoughts: faker.lorem.sentences(2),
      wakeUps: generateWakeUps(createdAt),
      createdAt,
    });
  }

  await SleepData.insertMany(sleepDataEntries);

  console.log('Seeded SleepData entries:', sleepDataEntries.length);
}

seed()
  .catch(err => {
    console.error('Seed error:', err);
  })
  .finally(() => {
    mongoose.disconnect();
    console.log('Disconnected and done.');
  });
