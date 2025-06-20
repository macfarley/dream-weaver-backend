/**
 * =============================================================================
 * ADMIN CONTROLLER - DreamWeaver Backend
 * =============================================================================
 * 
 * This controller handles administrative operations for user management.
 * All routes require proper authentication and most require admin privileges.
 * 
 * Key Features:
 * - User listing and retrieval (admin only)
 * - User profile updates (admin or self)
 * - Secure user deletion with password confirmation
 * - Input validation and sanitization
 * - Comprehensive error handling and logging
 * 
 * Security Considerations:
 * - All routes require valid JWT authentication
 * - Admin routes require additional role verification
 * - Password updates use bcrypt with salt rounds
 * - User deletion requires admin password confirmation
 * - Email uniqueness validation
 * - Sensitive data exclusion from responses
 * 
 * @author DreamWeaver Development Team
 * @version 1.0.0
 * =============================================================================
 */

// Core Express framework for routing
const express = require('express');
const router = express.Router();

// Data models
const User = require('../models/User');
const Bedroom = require('../models/Bedroom');
const SleepData = require('../models/SleepData');

// Security and authentication utilities
const bcrypt = require('bcrypt'); // For password hashing and comparison
const verifyToken = require('../middleware/verifyToken'); // JWT verification
const requireAdmin = require('../middleware/requireAdmin'); // Admin role check

/**
 * =============================================================================
 * GET /users
 * =============================================================================
 * Retrieves a list of all users in the system (admin only).
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Requires admin role
 * 
 * Response:
 * - Success: Array of user objects (passwords excluded)
 * - Error: 403 for non-admin users, 500 for server errors
 * 
 * Security Notes:
 * - Passwords are explicitly excluded from the response
 * - Admin access is logged for audit purposes
 * =============================================================================
 */
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        console.log(`[ADMIN] User list requested by admin: ${req.user.username} (${req.user.id})`);
        
        // Fetch all users from database, explicitly excluding sensitive password field
        const users = await User.find({}, '-hashedPassword');
        
        // Log successful admin operation for audit trail
        console.log(`[ADMIN] Successfully retrieved ${users.length} users for admin: ${req.user.username}`);
        
        // Return user list with success status
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        // Log detailed error for debugging while providing generic message to client
        console.error('[ADMIN] Error fetching users:', {
            error: error.message,
            stack: error.stack,
            adminUser: req.user.username,
            timestamp: new Date().toISOString()
        });
        
        // Return generic error message to prevent information leakage
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch users. Please try again later.' 
        });
    }
});

/**
 * =============================================================================
 * GET /users/:id
 * =============================================================================
 * Retrieves a specific user by their ID.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Accessible by: Admin users OR the user themselves (self-access)
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the target user
 * 
 * Response:
 * - Success: User object (password excluded)
 * - Error: 403 for unauthorized access, 404 for user not found, 500 for server errors
 * 
 * Security Notes:
 * - User can only access their own data unless they're an admin
 * - Passwords are explicitly excluded from the response
 * - Access attempts are logged for security monitoring
 * =============================================================================
 */
router.get('/users/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Validate the provided user ID format
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid user ID format.' 
            });
        }

        // Determine access permissions
        const isAdmin = req.user.role === 'admin';
        const isSelf = req.user.id === userId;
        
        // Enforce access control - only admin or self can access
        if (!isAdmin && !isSelf) {
            console.warn(`[SECURITY] Unauthorized user access attempt: ${req.user.username} tried to access user ${userId}`);
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. You can only access your own profile.' 
            });
        }

        // Find user by ID, exclude sensitive password field
        const user = await User.findById(userId, '-hashedPassword');
        if (!user) {
            console.warn(`[ADMIN] User not found: ${userId} requested by ${req.user.username}`);
            return res.status(404).json({ 
                success: false,
                error: 'User not found.' 
            });
        }

        // Log successful access for audit purposes
        console.log(`[ADMIN] User profile accessed: ${user.username} by ${req.user.username} (${isAdmin ? 'admin' : 'self'})`);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        // Log detailed error for debugging
        console.error('[ADMIN] Error fetching user:', {
            error: error.message,
            userId: req.params.id,
            requestingUser: req.user.username,
            timestamp: new Date().toISOString()
        });
        
        // Return generic error message
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch user. Please try again later.' 
        });
    }
});

/**
 * =============================================================================
 * PUT /users/:id
 * =============================================================================
 * Updates a user's profile information.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Accessible by: Admin users OR the user themselves (self-update)
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the target user
 * 
 * Request Body (all optional):
 * - email: String - new email address (must be unique)
 * - password: String - new password (min 6 characters)
 * - firstName: String - user's first name
 * - lastName: String - user's last name
 * - dateOfBirth: Date - user's date of birth
 * - userPreferences: Object - user preference settings
 * 
 * Protected Fields:
 * - username: Cannot be changed after account creation
 * - role: Cannot be changed via this endpoint (security measure)
 * 
 * Response:
 * - Success: Updated user object (password excluded)
 * - Error: 400 for validation errors, 403 for unauthorized access, 404 for user not found
 * 
 * Security Notes:
 * - Email uniqueness is validated across all users
 * - Passwords are hashed using bcrypt with salt
 * - Input validation prevents injection attacks
 * - Role and username changes are explicitly blocked
 * =============================================================================
 */
router.put('/users/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate the provided user ID format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID format.' 
      });
    }

    // Determine access permissions
    const isAdmin = req.user.role === 'admin';
    const isSelf = String(req.user.id) === String(userId);

    // Enforce access control - only admin or self can update
    if (!isAdmin && !isSelf) {
      console.warn(`[SECURITY] Unauthorized user update attempt: ${req.user.username} tried to update user ${userId}`);
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. You can only update your own profile.' 
      });
    }

    // Extract and validate input fields
    const { email, password, firstName, lastName, dateOfBirth, userPreferences } = req.body;
    const updateData = {};

    // Validate and process email update
    if (email !== undefined) {
      // Ensure email is a string and has basic email format
      if (typeof email !== 'string' || !email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email format. Please provide a valid email address.' 
        });
      }
      
      // Check for email uniqueness (case-insensitive)
      const normalizedEmail = email.toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && String(existingUser._id) !== String(userId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Email is already in use by another account.' 
        });
      }
      updateData.email = normalizedEmail;
    }

    // Validate and process name fields
    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || firstName.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'First name must be a non-empty string.' 
        });
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || lastName.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Last name must be a non-empty string.' 
        });
      }
      updateData.lastName = lastName.trim();
    }

    // Validate and process date of birth
    if (dateOfBirth !== undefined) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid date of birth format. Please use a valid date.' 
        });
      }
      
      // Check if date is not in the future
      if (dob > new Date()) {
        return res.status(400).json({ 
          success: false,
          error: 'Date of birth cannot be in the future.' 
        });
      }
      
      updateData.dateOfBirth = dob;
    }

    // Validate and process user preferences
    if (userPreferences !== undefined) {
      if (typeof userPreferences !== 'object' || userPreferences === null) {
        return res.status(400).json({ 
          success: false,
          error: 'User preferences must be a valid object.' 
        });
      }
      updateData.userPreferences = userPreferences;
    }

    // Validate and process password update
    if (password !== undefined) {
      // Ensure password meets minimum security requirements
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ 
          success: false,
          error: 'Password must be at least 6 characters long.' 
        });
      }
      
      // Hash the new password with salt for security
      const saltRounds = 10; // Standard salt rounds for bcrypt
      const salt = await bcrypt.genSalt(saltRounds);
      updateData.hashedPassword = await bcrypt.hash(password, salt);
      
      console.log(`[ADMIN] Password updated for user: ${userId} by ${req.user.username}`);
    }

    // Security check: Prevent role or username changes via this endpoint
    if ('role' in req.body || 'username' in req.body) {
      console.warn(`[SECURITY] Attempt to change protected field by ${req.user.username} for user ${userId}`);
      return res.status(400).json({ 
        success: false,
        error: 'Username and role cannot be changed through this endpoint.' 
      });
    }

    // Perform the database update with validation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true,           // Return the updated document
        runValidators: true  // Run mongoose schema validations
      }
    ).select('-hashedPassword'); // Exclude password from response

    // Check if user was found and updated
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found.' 
      });
    }

    // Log successful update for audit purposes
    console.log(`[ADMIN] User updated successfully: ${updatedUser.username} by ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updatedUser
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[ADMIN] Error updating user:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      requestingUser: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed. Please check your input data.' 
      });
    }
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * DELETE /users/:id
 * =============================================================================
 * Permanently deletes a user and ALL associated data from the system (admin only).
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Requires admin role
 * - Requires admin password confirmation for additional security
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the target user
 * 
 * Headers:
 * - x-admin-password: Admin's current password for confirmation
 * 
 * Cascade Deletion Process:
 * 1. Deletes all bedrooms owned by the user
 * 2. Deletes all sleep data/sessions for the user
 * 3. Finally deletes the user document
 * 
 * Response:
 * - Success: Confirmation message with deletion summary
 * - Error: 400 for missing password, 403 for unauthorized/wrong password, 404 for user not found
 * 
 * Security Notes:
 * - Requires admin password confirmation to prevent unauthorized deletions
 * - Admin cannot delete themselves (safety measure)
 * - Cannot delete other admin users (only users with role "user")
 * - All deletion attempts are logged for audit purposes
 * - Complete cascade deletion ensures no orphaned data remains
 * 
 * Warning: This operation is irreversible and removes ALL user data!
 * =============================================================================
 */
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminPassword = req.headers['x-admin-password'];

    // Validate the provided user ID format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID format.' 
      });
    }

    // Require admin password for deletion confirmation
    if (!adminPassword) {
      console.warn(`[SECURITY] User deletion attempted without admin password by ${req.user.username}`);
      return res.status(400).json({ 
        success: false,
        error: 'Admin password required for user deletion confirmation.' 
      });
    }

    // Prevent admin from deleting themselves (safety measure)
    if (String(req.user.id) === String(userId)) {
      console.warn(`[SECURITY] Admin ${req.user.username} attempted to delete their own account`);
      return res.status(400).json({ 
        success: false,
        error: 'You cannot delete your own admin account.' 
      });
    }

    // Verify admin's current password for additional security
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      console.error(`[SECURITY] Admin user not found during deletion: ${req.user.id}`);
      return res.status(403).json({ 
        success: false,
        error: 'Admin authentication failed.' 
      });
    }

    // Compare provided password with stored hash
    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.hashedPassword);
    if (!passwordMatch) {
      console.warn(`[SECURITY] Incorrect admin password for deletion by ${req.user.username}`);
      return res.status(403).json({ 
        success: false,
        error: 'Incorrect admin password. Deletion cancelled.' 
      });
    }

    // Find the user to be deleted for logging purposes
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found.' 
      });
    }

    // Prevent deletion of other admin users (security measure)
    if (targetUser.role === 'admin' && String(req.user.id) !== String(userId)) {
      console.warn(`[SECURITY] Admin ${req.user.username} attempted to delete another admin: ${targetUser.username}`);
      return res.status(403).json({ 
        success: false,
        error: 'Cannot delete other admin users. Only users with role "user" can be deleted.' 
      });
    }

    // =================================================================
    // CASCADE DELETION - Remove all user-related data
    // =================================================================
    console.log(`[ADMIN] Starting cascade deletion for user: ${targetUser.username}`);
    const deletionResults = {
      bedrooms: 0,
      sleepSessions: 0,
      user: 0
    };

    // Step 1: Delete all bedrooms owned by this user
    console.log(`[ADMIN] Deleting bedrooms for user: ${targetUser.username}`);
    const bedroomDeletion = await Bedroom.deleteMany({ ownerId: userId });
    deletionResults.bedrooms = bedroomDeletion.deletedCount;
    console.log(`[ADMIN] Deleted ${deletionResults.bedrooms} bedrooms for user: ${targetUser.username}`);

    // Step 2: Delete all sleep data/sessions for this user
    console.log(`[ADMIN] Deleting sleep data for user: ${targetUser.username}`);
    const sleepDataDeletion = await SleepData.deleteMany({ user: userId });
    deletionResults.sleepSessions = sleepDataDeletion.deletedCount;
    console.log(`[ADMIN] Deleted ${deletionResults.sleepSessions} sleep sessions for user: ${targetUser.username}`);

    // Step 3: Finally delete the user document
    console.log(`[ADMIN] Deleting user document: ${targetUser.username}`);
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      // This shouldn't happen since we already found the user, but just in case
      return res.status(404).json({ 
        success: false,
        error: 'User not found or already deleted during cascade deletion.' 
      });
    }
    deletionResults.user = 1;

    // Log comprehensive deletion summary for audit trail
    console.log(`[ADMIN] CASCADE DELETION COMPLETED for user: ${deletedUser.username}`);
    console.log(`[ADMIN] Deletion Summary:`, {
      user: deletedUser.username,
      userId: deletedUser._id,
      deletedBy: req.user.username,
      timestamp: new Date().toISOString(),
      results: deletionResults
    });

    res.status(200).json({ 
      success: true,
      message: `User '${deletedUser.username}' and all associated data have been permanently deleted.`,
      deletionSummary: {
        user: {
          id: deletedUser._id,
          username: deletedUser.username,
          email: deletedUser.email
        },
        deletedData: {
          bedrooms: deletionResults.bedrooms,
          sleepSessions: deletionResults.sleepSessions,
          totalRecords: deletionResults.bedrooms + deletionResults.sleepSessions + 1
        }
      }
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[ADMIN] ERROR during cascade deletion:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      adminUser: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Check if this is a partial deletion scenario
    if (error.message.includes('user not found during cascade')) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found. May have been deleted by another admin.' 
      });
    }
    
    // For any database errors during cascade deletion
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.error('[ADMIN] Database error during cascade deletion - manual cleanup may be required');
      return res.status(500).json({ 
        success: false,
        error: 'Database error during deletion. Some data may require manual cleanup.' 
      });
    }
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user and associated data. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * MODULE EXPORTS
 * =============================================================================
 * Export the router for use in the main application.
 * This router handles all admin-related user management operations.
 * =============================================================================
 */
module.exports = router;
