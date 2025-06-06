const mongoose = require('mongoose');

const { Schema } = mongoose;

const wakeUpSchema = new Schema({
    sleepQuality: {
        type: Number,
        required: true,
        min: 1, // 1 = very poor, 5 = excellent
        max: 5
    },
    dreamJournal: {
        type: String
    },
    awakenAt: {
        type: Date,
        required: true,
        default: Date.now // Default to current date if not provided
    }
}, { _id: false });

const goToBedSchema = new Schema({
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
        default: 'none' // Default cuddle buddy if not specified
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
//example of goToBedSchema
// {
//     "user": "60c72b2f9b1e8c001c8e4d5a",
//     "bedroom": "60c72b2f9b1e8c001c8e4d5b",
//     "cuddleBuddy": "pillow",
//     "sleepyThoughts": "I had a long day, need to relax.",
//     "createdAt": "2023-10-01T22:00:00Z"
// }
//example of wakeUpSchema
// {
//     "sleepQuality": 4,
//     "dreamJournal": "I dreamt about flying!",
//     "awakenAt": "2023-10-02T06:30:00Z"
// }
module.exports = mongoose.model('GoToBed', goToBedSchema);