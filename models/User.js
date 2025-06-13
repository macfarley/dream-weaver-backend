const mongoose = require('mongoose');

/**
 * Schema for storing user preferences such as units, date/time format, and theme.
 */
const userPreferencesSchema = new mongoose.Schema({
    // Whether to use metric units (true) or imperial (false)
    useMetric: {
        type: Boolean,
        default: false // Default to imperial units
    },
    // Preferred date format
    dateFormat: {
        type: String,
        enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
        default: 'MM/DD/YYYY' // Default date format
    },
    // Preferred time format
    timeFormat: {
        type: String,
        enum: ['12-hour', '24-hour'],
        default: '12-hour' // Default time format
    },
    // Preferred theme
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'dark' // Default theme
    },
});

/**
 * Helper function to check if a date is in the past.
 * @param {Date} date 
 * @returns {Boolean}
 */
function isDateInPast(date) {
    return date < new Date();
}

/**
 * Helper function to check if a date corresponds to an age of at least 18.
 * @param {Date} dateOfBirth 
 * @returns {Boolean}
 */
function isAtLeast18YearsOld(dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
    }
    return age >= 18;
}

/**
 * Main user schema for storing user information.
 */
const userSchema = new mongoose.Schema({
    // Unique username, trimmed, at least 3 characters
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    // First name, trimmed, at least 2 characters
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    // Last name, trimmed, at least 2 characters
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    // Date of birth, must be in the past and user must be at least 18
    dateOfBirth: {
        type: Date,
        required: true,
        validate: [
            {
                validator: isDateInPast,
                message: 'Date of birth must be in the past.'
            },
            {
                validator: isAtLeast18YearsOld,
                message: 'User must be at least 18 years old.'
            }
        ]
    },
    // Email, unique, trimmed, lowercase, must match email pattern
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    // Hashed password (hashing handled in controller)
    hashedPassword: {
        type: String,
        required: true,
    },
    // User preferences (optional)
    userPreferences: {
        type: userPreferencesSchema,
        default: null // Default to null if no preferences are set
    },
    // User role (user or admin)
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user' // Default role is user
    },
    // Date the user joined, defaults to now
    joinedAt: {
        type: Date,
        default: Date.now // Automatically set to current date
    },
});

// Create and export the User model
const User = mongoose.model('User', userSchema);
module.exports = User;