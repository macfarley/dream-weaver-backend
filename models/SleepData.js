const mongoose = require('mongoose');

const { Schema } = mongoose;

const wakeUpSchema = new Schema({
    sleepQuality: {
        type: Number,
        required: true,
        min: 1, // 1 = very poor, 10 = excellent
        max: 10
    },
    dreamJournal: {
        type: String
    },
    awakenAt: {
        type: Date,
        required: true,
        default: Date.now // Default to current date if not provided
    },
    backToBedAt: {
        type: Date, // optional, added if the user goes back to bed
        default: null
    }
}, { _id: false });

const sleepDataSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bedroom: {
        type: Schema.Types.ObjectId,
        ref: 'Bedroom',
        required: true
    },
    cuddleBuddy: {
        type: String,
        enum: ['none', 'pillow', 'stuffed animal', 'pet', 'person'],
        default: 'none'
    },
    sleepyThoughts: {
        type: String
    },
    wakeUps: [wakeUpSchema], // Array of wake-up entries
    createdAt: {
        type: Date,
        required: true,
        default: Date.now // Default to current date if not provided
    },
});
const SleepData = mongoose.model('SleepData', sleepDataSchema);
module.exports = SleepData;