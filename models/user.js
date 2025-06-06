const mongoose = require('mongoose');

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
        type: String,
        required: true,
        minlength: 6
    },
    preferredTimezone: {
        type: String,
        required: false,
        enum: [
            "Pacific/Midway (UTC-11:00)",
            "America/Adak (UTC-10:00)",
            "America/Anchorage (UTC-09:00)",
            "America/Los_Angeles (UTC-08:00)",
            "America/Denver (UTC-07:00)",
            "America/Chicago (UTC-06:00)",
            "America/New_York (UTC-05:00)",
            "America/Sao_Paulo (UTC-03:00)",
            "Europe/London (UTC+00:00)",
            "Europe/Berlin (UTC+01:00)",
            "Europe/Moscow (UTC+03:00)",
            "Asia/Dubai (UTC+04:00)",
            "Asia/Kolkata (UTC+05:30)",
            "Asia/Hong_Kong (UTC+08:00)",
            "Asia/Tokyo (UTC+09:00)",
            "Australia/Sydney (UTC+10:00)",
            "Pacific/Auckland (UTC+12:00)"
        ]
    },
    prefersImperial: {
        type: Boolean,
        required: false,
        default: false
    }
});

module.exports = mongoose.model('User', userSchema);