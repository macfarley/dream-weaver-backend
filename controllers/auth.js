/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER
 * ============================================================================
 * 
 * Handles all user authentication operations for the DreamWeaver application.
 * This includes user registration (sign-up), user login (sign-in), and JWT
 * token generation for secure session management.
 * 
 * Security Features:
 * - Password hashing with bcrypt (12 salt rounds for strong security)
 * - JWT token generation with configurable expiration
 * - Input validation and sanitization
 * - Duplicate user prevention (username and email uniqueness)
 * - Role-based access control (prevents privilege escalation)
 * - Comprehensive error handling and logging
 * 
 * Endpoints:
 * - POST /auth/sign-up - User registration
 * - POST /auth/sign-in - User login
 * - POST /auth/login - Alias for sign-in (backward compatibility)
 * 
 * Dependencies:
 * - bcrypt: Password hashing and verification
 * - jsonwebtoken: JWT token creation and verification
 * - User model: User data storage and validation
 * - Bedroom model: Automatic default bedroom creation
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import data models
const User = require('../models/User');    // User account data
const Bedroom = require('../models/Bedroom'); // Bedroom environment data

// Security configuration constants
const SALT_ROUNDS = 12;           // bcrypt salt rounds (higher = more secure but slower)
const JWT_SECRET = process.env.JWT_SECRET;  // Secret key for JWT signing (from environment)
const TOKEN_EXPIRY = '24h';       // JWT token expiration time (24 hours)

/**
 * Input validation helper for user registration
 * 
 * @param {Object} body - Request body containing user registration data
 * @returns {Object} Validation result with isValid flag and error messages
 * 
 * @description
 * Validates that all required fields for user registration are present
 * and meet basic format requirements. This is the first line of defense
 * against incomplete or malformed registration requests.
 */
function validateSignupFields(body) {
    const errors = [];
    const { username, email, password, firstName, lastName, dateOfBirth } = body;

    // Check for required fields
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        errors.push('Username is required and must be a non-empty string');
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        errors.push('Email is required and must be a non-empty string');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
        errors.push('Password is required and must be a non-empty string');
    }

    // Check password strength requirements
    if (password && password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    // Check for basic email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email must be a valid email address');
    }

    // Optional field validation
    if (firstName && (typeof firstName !== 'string' || firstName.trim().length < 2)) {
        errors.push('First name must be at least 2 characters long');
    }

    if (lastName && (typeof lastName !== 'string' || lastName.trim().length < 2)) {
        errors.push('Last name must be at least 2 characters long');
    }

    if (dateOfBirth && !(dateOfBirth instanceof Date) && !Date.parse(dateOfBirth)) {
        errors.push('Date of birth must be a valid date');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Input validation helper for user login
 * 
 * @param {Object} body - Request body containing login credentials
 * @returns {Object} Validation result with isValid flag and error messages
 * 
 * @description
 * Validates that all required fields for user login are present.
 * Ensures both username and password are provided as non-empty strings.
 */
function validateLoginFields(body) {
    const errors = [];
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        errors.push('Username is required and must be a non-empty string');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
        errors.push('Password is required and must be a non-empty string');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Helper function to generate JWT payload
 * 
 * @param {Object} user - User document from database
 * @returns {Object} JWT payload with user information
 * 
 * @description
 * Creates a standardized JWT payload with essential user information.
 * Includes both _id and id fields for compatibility with different
 * parts of the application.
 */
function createJWTPayload(user) {
    return {
        _id: user._id,                    // MongoDB ObjectId
        id: user._id.toString(),          // String version for compatibility
        username: user.username,          // Username for display/logging
        role: user.role || 'user'         // User role for authorization
    };
}

/**
 * POST /auth/sign-up
 * User Registration Endpoint
 * 
 * @route POST /auth/sign-up
 * @access Public
 * @description 
 * Creates a new user account with the provided information. Automatically
 * creates a default bedroom for the new user and returns a JWT token for
 * immediate authentication.
 * 
 * @param {string} username - Unique username for the account
 * @param {string} email - User's email address (must be unique)
 * @param {string} password - User's password (will be hashed)
 * @param {string} [firstName] - User's first name (optional, defaults to 'First')
 * @param {string} [lastName] - User's last name (optional, defaults to 'Last')
 * @param {Date} [dateOfBirth] - User's birth date (optional, defaults to 2000-01-01)
 * @param {Object} [userPreferences] - User preference settings (optional)
 * 
 * @returns {Object} JWT token for authentication
 * 
 * @example
 * POST /auth/sign-up
 * {
 *   "username": "dreamuser123",
 *   "email": "user@example.com",
 *   "password": "securePassword123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "dateOfBirth": "1990-05-15"
 * }
 * 
 * Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 */
router.post('/sign-up', async (req, res) => {
    try {
        // Extract and destructure fields from request body
        const {
            username,
            firstName,
            lastName,
            dateOfBirth,
            email,
            password,
            userPreferences,
            role,    // NOTE: This will be ignored for security
            joinedAt // NOTE: This will be ignored - server sets timestamp
        } = req.body;

        console.log(`📝 New user registration attempt: ${username} (${email})`);

        // Validate input fields using helper function
        const validation = validateSignupFields(req.body);
        if (!validation.isValid) {
            console.warn(`❌ Registration validation failed for ${username}: ${validation.errors.join(', ')}`);
            return res.status(400).json({ 
                error: 'Registration validation failed',
                message: validation.errors.join(', '),
                details: validation.errors
            });
        }

        // Check for existing users with the same username or email
        // This prevents duplicate accounts and maintains data integrity
        const existingUser = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: email.trim().toLowerCase() }
            ]
        });

        if (existingUser) {
            // Log the conflict for monitoring but don't specify which field conflicts (security)
            console.warn(`❌ Registration conflict for ${username}: User already exists`);
            
            // Generic error message to prevent username/email enumeration attacks
            return res.status(409).json({ 
                error: 'Account already exists',
                message: 'An account with this username or email already exists. Please try logging in or use different credentials.'
            });
        }

        // Hash the password using bcrypt with configured salt rounds
        // This ensures passwords are never stored in plain text
        console.log(`🔐 Hashing password for user: ${username}`);
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create new user document with validated and processed data
        const newUser = new User({
            username: username.trim(),
            firstName: firstName?.trim() || 'First',           // Provide defaults for optional fields
            lastName: lastName?.trim() || 'Last',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
            email: email.trim().toLowerCase(),                 // Normalize email to lowercase
            hashedPassword,
            userPreferences: userPreferences || null,
            role: 'user',                                     // SECURITY: Always 'user' for new signups
            joinedAt: new Date()                              // Server-controlled timestamp
        });

        // Save the new user to the database
        // This will trigger Mongoose validation rules defined in the User model
        console.log(`💾 Saving new user to database: ${username}`);
        await newUser.save();
        console.log(`✅ User created successfully: ${username} (${newUser._id})`);

        // Create a default bedroom for the new user
        // This provides a good starting point for sleep tracking
        const defaultBedroom = new Bedroom({
            ownerId: newUser._id,
            bedroomName: `${username}'s Bedroom`,             // Personalized bedroom name
            // All other fields will use their default values from the schema
        });

        await defaultBedroom.save();
        console.log(`🛏️ Default bedroom created for user: ${username}`);

        // Generate JWT token for immediate authentication
        // This allows the user to start using the app right after registration
        const jwtPayload = createJWTPayload(newUser);
        const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        console.log(`🎫 JWT token generated for user: ${username}`);

        // Return success response with authentication token
        // The frontend can immediately store this token and authenticate the user
        res.status(201).json({ 
            token,
            message: 'Account created successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        // Comprehensive error logging for debugging and monitoring
        console.error('🚨 ===== USER REGISTRATION ERROR =====');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Request body (sanitized):', {
            ...req.body,
            password: '[REDACTED]'  // Never log passwords
        });
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('JWT_SECRET configured:', !!JWT_SECRET);
        console.error('=====================================');

        // Handle specific error types with appropriate responses
        if (error.name === 'ValidationError') {
            // Mongoose validation errors from the User model
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'User data validation failed',
                message: 'The provided user information does not meet requirements',
                details: validationErrors
            });
        } else if (error.code === 11000) {
            // MongoDB duplicate key error (shouldn't happen due to our pre-check, but just in case)
            return res.status(409).json({
                error: 'Account already exists',
                message: 'An account with this information already exists'
            });
        } else {
            // Generic server error - don't expose internal details to client
            return res.status(500).json({
                error: 'Registration failed',
                message: 'An unexpected error occurred during account creation. Please try again.'
            });
        }
    }
});

/**
 * POST /auth/sign-in
 * User Login Endpoint
 * 
 * @route POST /auth/sign-in
 * @access Public
 * @description
 * Authenticates a user with username and password, returning a JWT token
 * for subsequent authenticated requests.
 * 
 * @param {string} username - User's username
 * @param {string} password - User's password (plain text, will be verified against hash)
 * 
 * @returns {Object} JWT token for authentication
 * 
 * @example
 * POST /auth/sign-in
 * {
 *   "username": "dreamuser123",
 *   "password": "securePassword123"
 * }
 * 
 * Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 */
router.post('/sign-in', async (req, res) => {
    try {
        // Extract login credentials from request body
        const { username, password } = req.body;

        console.log(`🔐 Login attempt for username: ${username}`);

        // Validate input fields using helper function
        const validation = validateLoginFields(req.body);
        if (!validation.isValid) {
            console.warn(`❌ Login validation failed for ${username}: ${validation.errors.join(', ')}`);
            return res.status(400).json({
                error: 'Invalid login request',
                message: validation.errors.join(', '),
                details: validation.errors
            });
        }

        // Find user by username in the database
        // We don't use email for login to keep it simple and secure
        const user = await User.findOne({ username: username.trim() });

        if (!user) {
            // Log failed login attempt for security monitoring
            console.warn(`❌ Login failed - user not found: ${username}`);
            
            // Generic error message to prevent username enumeration attacks
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'The username or password you entered is incorrect'
            });
        }

        // Verify the provided password against the stored hash
        // bcrypt.compare() handles the salt and hashing automatically
        console.log(`🔍 Verifying password for user: ${username}`);
        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

        if (!isPasswordValid) {
            // Log failed login attempt for security monitoring
            console.warn(`❌ Login failed - invalid password for user: ${username}`);
            
            // Same generic error message as above (don't indicate that username was valid)
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'The username or password you entered is incorrect'
            });
        }

        // Generate JWT token for successful authentication
        const jwtPayload = createJWTPayload(user);
        const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        console.log(`✅ Login successful for user: ${username} (${user.role})`);

        // Return success response with authentication token
        res.status(200).json({
            token,
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        // Comprehensive error logging for debugging and monitoring
        console.error('🚨 ===== USER LOGIN ERROR =====');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Username:', req.body.username || 'undefined');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('==============================');

        // Generic server error response
        res.status(500).json({
            error: 'Login failed',
            message: 'An unexpected error occurred during login. Please try again.'
        });
    }
});

/**
 * POST /auth/login
 * Alternative Login Endpoint (Backward Compatibility)
 * 
 * @route POST /auth/login
 * @access Public
 * @description
 * Alias for the /auth/sign-in endpoint to maintain backward compatibility
 * with existing client applications or API consumers.
 */
router.post('/login', async (req, res) => {
    // Forward the request to the sign-in handler
    // This ensures consistent behavior between both endpoints
    return router.post('/sign-in')(req, res);
});

// Export the router for use in the main application
module.exports = router;
