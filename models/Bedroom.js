/**
 * ============================================================================
 * BEDROOM ENVIRONMENT MODEL
 * ============================================================================
 * 
 * Defines the MongoDB schema for bedroom environments in the DreamWeaver app.
 * Each user can create multiple bedroom configurations to track how different
 * sleep environments affect their sleep quality and dreams.
 * 
 * Features:
 * - Comprehensive bedroom environment tracking
 * - Validation for realistic temperature and environment settings
 * - User ownership and privacy controls
 * - Automatic timestamp tracking for changes
 * - Conditional validation based on bed type
 * 
 * Relationships:
 * - User: Each bedroom belongs to one user (many-to-one)
 * - SleepData: Sleep sessions are linked to specific bedrooms (one-to-many)
 * ============================================================================
 */

const mongoose = require('mongoose');

/**
 * Bedroom Schema Definition
 * 
 * Tracks all relevant environmental factors that might affect sleep quality.
 * Includes physical setup (bed type, size) and environmental conditions
 * (temperature, light, noise levels).
 */
const bedroomSchema = new mongoose.Schema({
    /**
     * Owner Reference
     * Links this bedroom to a specific user account
     * Ensures users can only access their own bedroom configurations
     */
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
        required: [true, 'Bedroom must belong to a user'],
        index: true  // Index for faster queries by owner
    },
    
    /**
     * Bedroom Name
     * User-defined name to identify different bedroom setups
     * Must be unique globally to prevent confusion
     */
    bedroomName: {
        type: String,
        unique: true, // Global uniqueness across all users
        trim: true,   // Remove leading/trailing whitespace
        minlength: [3, 'Bedroom name must be at least 3 characters'],
        maxlength: [50, 'Bedroom name cannot exceed 50 characters'],
        required: [true, 'Bedroom name is required'],
        validate: {
            validator: function(name) {
                // Allow letters, numbers, spaces, and common punctuation
                return /^[a-zA-Z0-9\s\-_.,!?'()]+$/.test(name);
            },
            message: 'Bedroom name contains invalid characters'
        }
    },
    
    /**
     * Bed Type
     * The primary sleeping surface type
     * Affects which other fields are required or relevant
     */
    bedType: {
        type: String,
        required: [true, 'Bed type is required'],
        enum: {
            values: ['bean bag', 'sleeping bag', 'chair', 'couch', 'futon', 'bed'],
            message: 'Bed type must be one of: bean bag, sleeping bag, chair, couch, futon, bed'
        },
        default: 'bed'
    },
    
    /**
     * Mattress Type
     * Only relevant when bedType is 'bed' or 'futon'
     * Affects sleep comfort and quality tracking
     */
    mattressType: {
        type: String,
        enum: {
            values: ['memory foam', 'spring', 'latex', 'hybrid', 'air', 'water', 'none'],
            message: 'Mattress type must be one of: memory foam, spring, latex, hybrid, air, water, none'
        },
        default: 'memory foam',
        required: false // Will be validated conditionally in pre-validate hook
    },
    
    /**
     * Bed Size
     * Only relevant for actual beds
     * Important for comfort and sleep quality analysis
     */
    bedSize: {
        type: String,
        enum: {
            values: ['twin', 'twin xl', 'full', 'queen', 'king', 'california king', 'custom'],
            message: 'Bed size must be one of: twin, twin xl, full, queen, king, california king, custom'
        },
        default: 'queen',
        required: false // Will be validated conditionally in pre-validate hook
    },
    
    /**
     * Room Temperature
     * Temperature in Fahrenheit (can be converted for metric users)
     * Critical factor for sleep quality
     */
    temperature: {
        type: Number,
        required: [true, 'Room temperature is required'],
        min: [40, 'Temperature cannot be below 40°F (too cold for safe sleep)'],
        max: [100, 'Temperature cannot be above 100°F (too hot for comfortable sleep)'],
        default: 68, // Optimal sleep temperature range is typically 65-70°F
        validate: {
            validator: function(temp) {
                // Ensure temperature is a reasonable number (not NaN, Infinity, etc.)
                return Number.isFinite(temp);
            },
            message: 'Temperature must be a valid number'
        }
    },
    
    /**
     * Light Level
     * Ambient light conditions in the bedroom
     * Affects melatonin production and sleep quality
     */
    lightLevel: {
        type: String,
        required: [true, 'Light level is required'],
        enum: {
            values: ['pitch black', 'very dim', 'dim', 'moderate', 'bright', 'daylight'],
            message: 'Light level must be one of: pitch black, very dim, dim, moderate, bright, daylight'
        },
        default: 'dim'
    },
    
    /**
     * Noise Level
     * Ambient noise conditions in the bedroom
     * Important factor for sleep quality and dream recall
     */
    noiseLevel: {
        type: String,
        required: [true, 'Noise level is required'],
        enum: {
            values: ['silent', 'very quiet', 'quiet', 'moderate', 'loud', 'very loud'],
            message: 'Noise level must be one of: silent, very quiet, quiet, moderate, loud, very loud'
        },
        default: 'quiet'
    },
    
    /**
     * Pillow Count/Configuration
     * Number and arrangement of pillows
     * Affects comfort and sleep position
     */
    pillows: {
        type: String,
        enum: {
            values: [
                'none', 
                'one', 
                'two', 
                'three', 
                'four', 
                'five', 
                'many (5+)',
                'body pillow',
                'custom setup'
            ],
            message: 'Pillow configuration must be a valid option'
        },
        default: 'two'
    },
    
    /**
     * Favorite Bedroom Flag
     * Allows users to mark their preferred bedroom setup
     * Only one bedroom per user should be marked as favorite
     */
    favorite: {
        type: Boolean,
        default: false
    },
    
    /**
     * Additional Notes
     * Free-form text for additional bedroom details
     * Can include comfort items, special conditions, etc.
     */
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
        default: '',
        trim: true
    },
    
    /**
     * Last Updated Timestamp
     * Automatically tracks when bedroom configuration was last modified
     * Useful for determining most recently used setups
     */
    lastUpdatedAt: {
        type: Date,
        default: Date.now,
        required: true
    }
}, {
    // Schema options
    timestamps: true, // Automatically add createdAt and updatedAt
    
    // Improve JSON output
    toJSON: {
        transform: function(doc, ret) {
            // Remove internal versioning field
            delete ret.__v;
            return ret;
        }
    }
});

/**
 * Pre-validation middleware
 * Enforces conditional validation rules based on bed type
 */
bedroomSchema.pre('validate', function(next) {
    try {
        // If bedType is 'bed', require mattress type and size
        if (this.bedType === 'bed') {
            if (!this.mattressType || this.mattressType === 'none') {
                this.invalidate('mattressType', 'Mattress type is required when bed type is "bed"');
            }
            if (!this.bedSize) {
                this.invalidate('bedSize', 'Bed size is required when bed type is "bed"');
            }
        }
        
        // If bedType is 'futon', require mattress type
        if (this.bedType === 'futon') {
            if (!this.mattressType || this.mattressType === 'none') {
                this.invalidate('mattressType', 'Mattress type is required for futons');
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-save middleware
 * Updates the lastUpdatedAt timestamp before saving
 */
bedroomSchema.pre('save', function(next) {
    try {
        this.lastUpdatedAt = new Date();
        
        // Ensure bedroom name is properly formatted
        if (this.bedroomName) {
            this.bedroomName = this.bedroomName.trim();
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Pre-update middleware
 * Updates the lastUpdatedAt timestamp before updating
 */
bedroomSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
    try {
        this.set({ lastUpdatedAt: new Date() });
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Instance method to get a summary of bedroom conditions
 * @returns {string} A human-readable summary of the bedroom setup
 */
bedroomSchema.methods.getSummary = function() {
    return `${this.bedroomName}: ${this.bedType} (${this.temperature}°F, ${this.lightLevel} light, ${this.noiseLevel} noise)`;
};

/**
 * Instance method to check if this is an optimal sleep environment
 * @returns {object} Analysis of bedroom conditions with recommendations
 */
bedroomSchema.methods.getEnvironmentAnalysis = function() {
    const analysis = {
        optimal: true,
        issues: [],
        recommendations: []
    };
    
    // Check temperature (optimal range is 65-70°F)
    if (this.temperature < 65) {
        analysis.optimal = false;
        analysis.issues.push('Room may be too cold');
        analysis.recommendations.push('Consider increasing temperature to 65-70°F');
    } else if (this.temperature > 70) {
        analysis.optimal = false;
        analysis.issues.push('Room may be too warm');
        analysis.recommendations.push('Consider decreasing temperature to 65-70°F');
    }
    
    // Check light level
    if (['bright', 'daylight'].includes(this.lightLevel)) {
        analysis.optimal = false;
        analysis.issues.push('Room may be too bright for optimal sleep');
        analysis.recommendations.push('Consider dimming lights or using blackout curtains');
    }
    
    // Check noise level
    if (['loud', 'very loud'].includes(this.noiseLevel)) {
        analysis.optimal = false;
        analysis.issues.push('Room may be too noisy for quality sleep');
        analysis.recommendations.push('Consider using earplugs or white noise machine');
    }
    
    return analysis;
};

/**
 * Static method to find bedrooms by owner
 * @param {string} ownerId - The user's ObjectId
 * @returns {Promise} Promise that resolves to array of user's bedrooms
 */
bedroomSchema.statics.findByOwner = function(ownerId) {
    return this.find({ ownerId: ownerId }).sort({ favorite: -1, lastUpdatedAt: -1 });
};

/**
 * Create index for better query performance
 */
bedroomSchema.index({ ownerId: 1, favorite: -1 });
bedroomSchema.index({ bedroomName: 1 }, { unique: true });

module.exports = mongoose.model('Bedroom', bedroomSchema);
