/**
 * ============================================================================
 * USER DATA MODEL
 * ============================================================================
 * 
 * Defines the MongoDB schema for user accounts in the DreamWeaver application.
 * This model handles user authentication data, profile information, preferences,
 * and role-based access control.
 * 
 * Features:
 * - Secure password storage (hashed, never plain text)
 * - User preference system for personalization
 * - Role-based access control (user/admin)
 * - Data validation and business rule enforcement
 * - Age verification (18+ requirement)
 * - Email uniqueness and format validation
 * 
 * Related Models:
 * - Bedroom: Users can have multiple bedrooms (one-to-many)
 * - SleepData: Users can have multiple sleep sessions (one-to-many)
 * ============================================================================
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for user preferences and personalization settings
 * 
 * This allows users to customize their experience with the application
 * including display formats, measurement units, and visual themes.
 */
const userPreferencesSchema = new mongoose.Schema({
    /**
     * Measurement Units Preference
     * Determines whether the user sees metric (cm, kg) or imperial (in, lbs) units
     */
    useMetric: {
        type: Boolean,
        default: false, // Default to imperial units (US standard)
        required: false
    },
    
    /**
     * Date Display Format Preference
     * Controls how dates are displayed throughout the application
     */
    dateFormat: {
        type: String,
        enum: {
            values: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
            message: 'Date format must be MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD'
        },
        default: 'MM/DD/YYYY', // US format as default
        required: false
    },
    
    /**
     * Time Display Format Preference
     * Controls whether time is shown in 12-hour (AM/PM) or 24-hour format
     */
    timeFormat: {
        type: String,
        enum: {
            values: ['12-hour', '24-hour'],
            message: 'Time format must be either "12-hour" or "24-hour"'
        },
        default: '12-hour', // 12-hour format as default
        required: false
    },
    
    /**
     * Visual Theme Preference
     * Controls the color scheme and visual appearance of the application
     */
    theme: {
        type: String,
        enum: {
            values: ['light', 'dark', 'auto'],
            message: 'Theme must be "light", "dark", or "auto"'
        },
        default: 'dark', // Dark theme as default for sleep app
        required: false
    }
}, {
    // Don't create a separate _id for this sub-document
    _id: true,
    // Add timestamps for when preferences are modified
    timestamps: false
});

/**
 * Validation helper function: Check if a date is in the past
 * 
 * @param {Date} date - The date to validate
 * @returns {boolean} - True if the date is in the past, false otherwise
 * 
 * @description
 * Ensures that birth dates are realistic (not in the future).
 * Uses current system time for comparison.
 */
function isDateInPast(date) {
    // Create a new Date object for current time to avoid timezone issues
    const now = new Date();
    
    // Compare the provided date with current time
    return date < now;
}

/**
 * Validation helper function: Check if birth date corresponds to 18+ years of age
 * 
 * @param {Date} dateOfBirth - The birth date to validate
 * @returns {boolean} - True if the person is 18 or older, false otherwise
 * 
 * @description
 * Enforces the 18+ age requirement for user registration.
 * Properly handles leap years and edge cases around birthdays.
 */
function isAtLeast18YearsOld(dateOfBirth) {
    // Get current date for age calculation
    const today = new Date();
    
    // Calculate the difference in years
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    
    // Calculate the difference in months and days to determine if birthday has passed
    const monthDifference = today.getMonth() - dateOfBirth.getMonth();
    const dayDifference = today.getDate() - dateOfBirth.getDate();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }
    
    // Return true if user is 18 or older
    return age >= 18;
}

/**
 * Validation helper function: Validate email format
 * 
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if email format is valid, false otherwise
 * 
 * @description
 * More comprehensive email validation than the basic regex.
 * Checks for common email format requirements.
 */
function isValidEmail(email) {
    // Basic email regex pattern - covers most valid email formats
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Check length constraints
    if (email.length > 254) return false; // RFC 5321 limit
    
    // Check basic format
    return emailRegex.test(email);
}

/**
 * Main User Schema Definition
 * 
 * Defines the structure and validation rules for user documents in MongoDB.
 * Each field includes comprehensive validation, type checking, and business rules.
 */
const userSchema = new mongoose.Schema({
    /**
     * Username Field
     * Unique identifier chosen by the user for login and display
     */
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true, // Ensures no duplicate usernames in database
        trim: true,   // Remove leading/trailing whitespace
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        validate: {
            validator: function(username) {
                // Allow alphanumeric characters, underscores, and hyphens
                // No spaces, special characters, or starting with numbers
                return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username);
            },
            message: 'Username must start with a letter and contain only letters, numbers, underscores, and hyphens'
        }
    },
    
    /**
     * First Name Field
     * User's given name for personalization and identification
     */
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters long'],
        maxlength: [50, 'First name cannot exceed 50 characters'],
        validate: {
            validator: function(name) {
                // Allow letters, spaces, hyphens, and apostrophes (for names like O'Connor)
                return /^[a-zA-Z\s'-]+$/.test(name);
            },
            message: 'First name can only contain letters, spaces, hyphens, and apostrophes'
        }
    },
    
    /**
     * Last Name Field
     * User's family name for identification and personalization
     */
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters long'],
        maxlength: [50, 'Last name cannot exceed 50 characters'],
        validate: {
            validator: function(name) {
                // Allow letters, spaces, hyphens, and apostrophes
                return /^[a-zA-Z\s'-]+$/.test(name);
            },
            message: 'Last name can only contain letters, spaces, hyphens, and apostrophes'
        }
    },
    
    /**
     * Date of Birth Field
     * Used for age verification and personalization
     * Must be in the past and indicate user is 18+
     */
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: [
            {
                validator: isDateInPast,
                message: 'Date of birth must be in the past'
            },
            {
                validator: isAtLeast18YearsOld,
                message: 'You must be at least 18 years old to register'
            }
        ]
    },
    
    /**
     * Email Field
     * Used for account recovery, notifications, and login
     * Must be unique across all users
     */
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,     // Ensures no duplicate emails in database
        trim: true,       // Remove leading/trailing whitespace
        lowercase: true,  // Convert to lowercase for consistency
        maxlength: [254, 'Email address is too long'],
        validate: {
            validator: isValidEmail,
            message: 'Please enter a valid email address'
        }
    },
    
    /**
     * Hashed Password Field
     * Stores the bcrypt hash of the user's password
     * NEVER store plain text passwords!
     */
    hashedPassword: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [60, 'Invalid password hash format'], // bcrypt hashes are typically 60 characters
        validate: {
            validator: function(hash) {
                // Validate that this looks like a bcrypt hash
                return /^\$2[aby]?\$\d+\$/.test(hash);
            },
            message: 'Invalid password hash format'
        }
    },
    
    /**
     * User Preferences Field
     * Optional personalization settings for the user interface
     * Uses the embedded userPreferencesSchema defined above
     */
    userPreferences: {
        type: userPreferencesSchema,
        default: null,  // Allow null for users who haven't set preferences yet
        required: false
    },
    
    /**
     * Role Field
     * Determines user's access level within the application
     * 'user' = standard user, 'admin' = administrative privileges
     */
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: 'Role must be either "user" or "admin"'
        },
        default: 'user', // All new registrations default to standard user
        required: true
    },
    
    /**
     * Account Creation Timestamp
     * Automatically records when the user account was created
     * Useful for analytics, account age verification, and auditing
     */
    joinedAt: {
        type: Date,
        default: Date.now, // Automatically set to current timestamp
        required: true
    }
}, {
    // Schema-level options
    timestamps: true, // Automatically add createdAt and updatedAt fields
    
    // Transform function to control JSON output
    // This removes sensitive data when converting to JSON
    toJSON: {
        transform: function(doc, ret) {
            // Remove sensitive fields from JSON output
            delete ret.hashedPassword;
            delete ret.__v;
            return ret;
        }
    },
    
    // Transform function for toObject() calls
    toObject: {
        transform: function(doc, ret) {
            // Remove sensitive fields from object output
            delete ret.hashedPassword;
            delete ret.__v;
            return ret;
        }
    }
});

/**
 * Pre-save middleware to ensure data consistency
 * This runs before any save operation (create or update)
 */
userSchema.pre('save', function(next) {
    try {
        // Ensure email is lowercase for consistency
        if (this.email) {
            this.email = this.email.toLowerCase();
        }
        
        // Ensure username is properly formatted
        if (this.username) {
            this.username = this.username.trim();
        }
        
        // Ensure names are properly capitalized
        if (this.firstName) {
            this.firstName = this.firstName.trim();
        }
        
        if (this.lastName) {
            this.lastName = this.lastName.trim();
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Instance method to get user's full name
 * @returns {string} The user's full name (first + last)
 */
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`.trim();
};

/**
 * Instance method to get user's age
 * @returns {number} The user's current age in years
 */
userSchema.methods.getAge = function() {
    const today = new Date();
    let age = today.getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
        age--;
    }
    
    return age;
};

/**
 * Instance method to check if user is an administrator
 * @returns {boolean} True if user has admin role, false otherwise
 */
userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

/**
 * Static method to find users by role
 * @param {string} role - The role to search for ('user' or 'admin')
 * @returns {Promise} Promise that resolves to array of users with specified role
 */
userSchema.statics.findByRole = function(role) {
    return this.find({ role: role });
};

/**
 * Create and export the User model
 * This model can be imported and used throughout the application
 */
const User = mongoose.model('User', userSchema);

module.exports = User;