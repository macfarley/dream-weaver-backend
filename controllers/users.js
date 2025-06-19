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
 * PUT /profile
 * =============================================================================
 * Updates the authenticated user's profile information.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only update their own profile
 * 
 * Request Body (all optional):
 * - firstName: String - user's first name
 * - lastName: String - user's last name
 * - email: String - user's email address
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
 * - Email format and uniqueness validation
 * - Date format validation for dateOfBirth
 * - User preferences object structure validation
 * =============================================================================
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[USER_PROFILE] Updating profile for user: ${req.user.username}`);
    
    const updateData = { ...req.body };
    
    // Remove protected fields that cannot be changed via this endpoint
    delete updateData.username;    // Username is immutable
    delete updateData.role;        // Role changes require admin privileges
    delete updateData.hashedPassword; // Password changes need separate endpoint
    delete updateData.password;    // Same as above
    
    // Validate email format if provided
    if (updateData.email) {
      if (typeof updateData.email !== 'string' || !updateData.email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
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
    
    // Validate user preferences if provided
    if (updateData.userPreferences !== undefined) {
      if (typeof updateData.userPreferences !== 'object' || updateData.userPreferences === null) {
        return res.status(400).json({ 
          success: false,
          error: 'User preferences must be a valid object.' 
        });
      }
    }
    
    // Validate name fields if provided
    if (updateData.firstName !== undefined) {
      if (typeof updateData.firstName !== 'string' || updateData.firstName.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'First name must be a non-empty string.' 
        });
      }
      updateData.firstName = updateData.firstName.trim();
    }
    
    if (updateData.lastName !== undefined) {
      if (typeof updateData.lastName !== 'string' || updateData.lastName.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Last name must be a non-empty string.' 
        });
      }
      updateData.lastName = updateData.lastName.trim();
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

    // Log successful update
    console.log(`[USER_PROFILE] Profile updated successfully for user: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser
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