/**
 * =============================================================================
 * USERS CONTROLLER - DreamWeaver Backend
 * =============================================================================
 *
 * This controller manages user profile operations for authenticated users.
 *
 * Exposed Endpoints:
 * - GET /profile   - Returns the full user object for the authenticated user
 * - PATCH /profile - Updates the authenticated user's profile (partial update, returns new JWT)
 *
 * Security Considerations:
 * - All routes require valid JWT authentication
 * - Comprehensive input validation and sanitization
 * - No admin or user listing functions here (admin-only, handled elsewhere)
 *
 * Data Relationships:
 * - User profile data only (no sleep data or admin functions)
 * - Privacy protection for sensitive user information
 *
 * @author DreamWeaver Development Team
 * @version 1.0.0
 * =============================================================================
 */

// Core Express framework for routing
const express = require('express');
const router = express.Router();

// Data models
const User = require('../models/User');        // User account management

// Authentication middleware
const verifyToken = require('../middleware/verifyToken');   // JWT verification
const jwtUtils = require('../utils/jwt');

// Apply JWT verification to all routes in this controller
// This ensures all user operations require authentication
router.use(verifyToken);

/**
 * =============================================================================
 * GET /profile
 * =============================================================================
 * Returns the authenticated user's full profile (all fields except password hash).
 * Requires a valid JWT. Extracts userId from token, finds user by ID, and returns the user object.
 * =============================================================================
 */
router.get('/profile', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    const userId = req.user.id;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    // Remove hashedPassword if present
    delete user.hashedPassword;
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[USER_PROFILE] Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
});

/**
 * =============================================================================
 * PATCH /profile
 * =============================================================================
 * Updates the authenticated user's profile information using PATCH semantics.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only update their own profile
 * 
 * PATCH Semantics:
 * - Only provided fields are updated (partial updates)
 * - Missing fields are ignored (not updated)
 * - Empty strings are valid and will clear/empty fields
 * - Null values are treated as field clearing
 * 
 * Request Body (all optional):
 * - firstName: String - user's first name (empty string clears field)
 * - lastName: String - user's last name (empty string clears field)
 * - email: String - user's email address (empty string clears field)
 * - dateOfBirth: Date - user's date of birth
 * - userPreferences: Object - user preference settings
 * 
 * Protected Fields:
 * - username: Cannot be changed after account creation
 * - role: Cannot be changed via this endpoint
 * - hashedPassword: Use separate password change endpoint
 * 
 * Response:
 * - Success: Updated user object (password excluded)
 * - Error: 400 for validation errors, 500 for server errors
 * 
 * Validation:
 * - Email format validation (only for non-empty emails)
 * - Email uniqueness validation
 * - Date format validation for dateOfBirth
 * - User preferences object structure validation
 * =============================================================================
 */
router.patch('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[USER_PROFILE] PATCH profile request for user: ${req.user.username}`, {
      providedFields: Object.keys(req.body),
      timestamp: new Date().toISOString()
    });
    
    const updateData = { ...req.body };
    
    // Remove protected fields that cannot be changed via this endpoint
    delete updateData.username;    // Username is immutable
    delete updateData.role;        // Role changes require admin privileges
    delete updateData.hashedPassword; // Password changes need separate endpoint
    delete updateData.password;    // Same as above
    
    // Validate email format if provided and not empty
    if (updateData.email !== undefined) {
      if (updateData.email !== '' && typeof updateData.email === 'string') {
        if (!updateData.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
          return res.status(400).json({ 
            success: false,
            error: 'Invalid email format.' 
          });
        }
        
        // Check for email uniqueness
        const existingUser = await User.findOne({ 
          email: updateData.email.toLowerCase(),
          _id: { $ne: userId } // Exclude current user
        });
        
        if (existingUser) {
          return res.status(400).json({ 
            success: false,
            error: 'Email is already in use by another account.' 
          });
        }
        
        updateData.email = updateData.email.toLowerCase(); // Normalize email
      } else if (updateData.email === '') {
        // Allow empty string to clear email (if business logic permits)
        updateData.email = '';
      } else {
        return res.status(400).json({ 
          success: false,
          error: 'Email must be a string.' 
        });
      }
    }
    
    // Validate date of birth if provided
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid date of birth format.' 
        });
      }
      
      if (dob > new Date()) {
        return res.status(400).json({ 
          success: false,
          error: 'Date of birth cannot be in the future.' 
        });
      }
      
      updateData.dateOfBirth = dob;
    }
    
    // Handle individual preference fields by building userPreferences object
    const preferenceFields = [
      'prefersImperial', 'theme', 'dateFormat', 'timeFormat', 
      'sleepReminderEnabled', 'sleepReminderHours'
    ];
    
    const hasPreferenceFields = preferenceFields.some(field => updateData[field] !== undefined);
    
    if (hasPreferenceFields) {
      // If individual preference fields are provided, build the userPreferences object
      if (!updateData.userPreferences) {
        updateData.userPreferences = {};
      }
      
      // Move individual preference fields into userPreferences object
      preferenceFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateData.userPreferences[field] = updateData[field];
          delete updateData[field]; // Remove from top level
        }
      });
    }
    
    // Validate user preferences if provided
    if (updateData.userPreferences !== undefined) {
      if (typeof updateData.userPreferences !== 'object' || updateData.userPreferences === null) {
        return res.status(400).json({ 
          success: false,
          error: 'User preferences must be a valid object.' 
        });
      }
    }
    
    // Validate name fields - allow empty strings to clear fields
    if (updateData.firstName !== undefined) {
      if (typeof updateData.firstName !== 'string') {
        return res.status(400).json({ 
          success: false,
          error: 'First name must be a string.' 
        });
      }
      // Allow empty string to clear first name, otherwise trim whitespace
      updateData.firstName = updateData.firstName === '' ? '' : updateData.firstName.trim();
    }
    
    if (updateData.lastName !== undefined) {
      if (typeof updateData.lastName !== 'string') {
        return res.status(400).json({ 
          success: false,
          error: 'Last name must be a string.' 
        });
      }
      // Allow empty string to clear last name, otherwise trim whitespace
      updateData.lastName = updateData.lastName === '' ? '' : updateData.lastName.trim();
    }

    // Update user document with validation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true,           // Return updated document
        runValidators: true  // Run mongoose schema validations
      }
    ).select('-hashedPassword'); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found.' 
      });
    }

    // Generate a new JWT reflecting any profile changes
    const jwtPayload = {
      _id: updatedUser._id,
      id: updatedUser._id.toString(),
      username: updatedUser.username,
      role: updatedUser.role || 'user'
    };
    const token = jwtUtils.generateToken(jwtPayload);

    // Log successful update
    console.log(`[USER_PROFILE] Profile updated successfully for user: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser, // Changed from 'data' to 'user' for frontend compatibility
      token // New JWT for frontend to use
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[USER_PROFILE] Error updating profile:', {
      error: error.message,
      stack: error.stack,
      username: req.user.username,
      updateFields: Object.keys(req.body),
      timestamp: new Date().toISOString()
    });
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed: ' + validationErrors.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * MODULE EXPORTS
 * =============================================================================
 * Export the router for use in the main application.
 * This router handles user profile operations and personal sleep data access.
 * 
 * Note: Administrative user management functions are handled by the 
 * admin controller to maintain proper separation of concerns.
 * =============================================================================
 */
module.exports = router;