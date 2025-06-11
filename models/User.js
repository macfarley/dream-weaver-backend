const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
    useMetric: {
        type: Boolean,
        default: false // Default to imperial units
    },
    dateFormat: {
        type: String,
        enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
        default: 'MM/DD/YYYY' // Default date format
    },
    timeFormat: {
        type: String,
        enum: ['12-hour', '24-hour'],
        default: '12-hour' // Default time format
    },
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'dark' // Default theme
    },
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    dateOfBirth: {
        type: Date,
        required: true,
        validate: [
            {
                validator: function(v) {
                    return v < new Date();
                },
                message: 'Date of birth must be in the past.'
            },
            {
                validator: function(v) {
                    const today = new Date();
                    const age = today.getFullYear() - v.getFullYear();
                    const m = today.getMonth() - v.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < v.getDate())) {
                        return age - 1 >= 18;
                    }
                    return age >= 18;
                },
                message: 'User must be at least 18 years old.'
            }
        ]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    hashedPassword: {
// front end validation will enforce password strength, controller handles hashing
        type: String,
        required: true,
    },
    userPreferences: {
        type: userPreferencesSchema,
        default: null // Default to null if no preferences are set
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user' // Default role is user
    },
});


const User = mongoose.model('User', userSchema);
module.exports = User;