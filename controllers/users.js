/**
 * =============================================================================
 * USERS CONTROLLER - DreamWeaver Backend
 * =============================================================================
 * 
 * This controller manages user-related operations including profile management,
 * sleep data retrieval, and administrative user management functions.
 * 
 * Key Features:
 * - User profile updates and management
 * - Personal sleep data retrieval
 * - Administrative user management (admin-only)
 * - Role management and user deletion (admin-only)
 * - Comprehensive data cleanup on user deletion
 * 
 * Route Structure:
 * - GET / - Retrieve user's sleep data
 * - PUT /profile - Update user profile
 * - GET /admin/all - List all users (admin-only)
 * - PUT /admin/:userId/role - Change user role (admin-only)  
 * - DELETE /admin/:userId - Delete user (admin-only)
 * 
 * Security Considerations:
 * - All routes require valid JWT authentication
 * - Admin routes require additional role verification
 * - Admins cannot modify other admin accounts
 * - Admins cannot delete themselves
 * - Comprehensive input validation and sanitization
 * - Audit logging for administrative actions
 * 
 * Data Relationships:
 * - Links to sleep data, bedrooms, and related user content
 * - Cascade deletion for user-related data
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
const SleepData = require('../models/SleepData'); // User sleep tracking data

// Authentication middleware
const verifyToken = require('../middleware/verifyToken');   // JWT verification
const jwtUtils = require('../utils/jwt');

// Apply JWT verification to all routes in this controller
// This ensures all user operations require authentication
router.use(verifyToken);

/**
 * =============================================================================
 * GET /
 * =============================================================================
 * Retrieves all sleep data entries for the authenticated user.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only access their own sleep data
 * 
 * Response:
 * - Success: Array of sleep data objects with bedroom details
 * - Error: 500 for server errors
 * 
 * Data Included:
 * - Complete sleep session information
 * - Associated bedroom details (name only for privacy)
 * - Wake-up events and quality ratings
 * - Sorted by creation date (most recent first)
 * 
 * Use Cases:
 * - Mobile app sleep history display
 * - User dashboard sleep data overview
 * - Sleep pattern analysis and reporting
 * =============================================================================
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from verified JWT token
        console.log(`[USER_DATA] Fetching sleep data for user: ${req.user.username}`);

        // Find all sleep data entries for the authenticated user
        const sleepEntries = await SleepData.find({ user: userId })
            .populate('bedroom', 'bedroomName description') // Include bedroom details
            .populate('user', 'username firstName lastName') // Include basic user info
            .sort({ createdAt: -1 }); // Sort by most recent first

        // Log successful retrieval
        console.log(`[USER_DATA] Successfully retrieved ${sleepEntries.length} sleep entries for user: ${req.user.username}`);

        res.status(200).json({
            success: true,
            count: sleepEntries.length,
            data: sleepEntries
        });
    } catch (error) {
        // Log detailed error for debugging
        console.error('[USER_DATA] Error retrieving sleep data:', {
            error: error.message,
            stack: error.stack,
            username: req.user.username,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve sleep data. Please try again later.' 
        });
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
      data: updatedUser,
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