// Import mongoose and extract Schema constructor
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Subdocument schema for individual wake-up entries during a sleep session.
 * Each wake-up can record sleep quality, dream notes, and timing.
 */
const wakeUpSchema = new Schema(
  {
    // User's rating of sleep quality upon waking (1-10)
    sleepQuality: {
      type: Number,
      min: 1,
      max: 10,
      required: true,
    },
    // Optional dream journal entry for this wake-up
    dreamJournal: {
      type: String,
      default: '',
    },
    // Timestamp for when the user woke up
    awakenAt: {
      type: Date,
      default: Date.now,
    },
    // Indicates if the user finished sleeping after this wake-up
    finishedSleeping: {
      type: Boolean,
      default: true,
    },
    // If the user went back to bed, when did that happen?
    backToBedAt: {
      type: Date,
      default: null,
    },
  },
  {
    // Prevent Mongoose from creating an _id for each wakeUp subdocument
    _id: false,
  }
);

/**
 * Main schema for a user's sleep data entry.
 * Contains references to user and bedroom, as well as sleep session details.
 */
const sleepDataSchema = new Schema({
  // Reference to the User who owns this sleep data
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Reference to the Bedroom where the sleep occurred
  bedroom: {
    type: Schema.Types.ObjectId,
    ref: 'Bedroom',
    required: true,
  },
  // What (if anything) did the user cuddle with?
  cuddleBuddy: {
    type: String,
    enum: ['none', 'pillow', 'stuffed animal', 'pet', 'person'],
    default: 'none',
  },
  // User's thoughts before falling asleep
  sleepyThoughts: {
    type: String,
    default: '',
  },
  // Array of wake-up events during this sleep session
  wakeUps: {
    type: [wakeUpSchema],
    default: [],
  },
  // When was this sleep data entry created?
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Export the SleepData model.
 * Use mongoose.models to avoid OverwriteModelError in development.
 */
module.exports =
  mongoose.models.SleepData ||
  mongoose.model('SleepData', sleepDataSchema);
