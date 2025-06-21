/**
 * =============================================================================
 * SLEEP DATA CONTROLLER - DreamWeaver Backend
 * =============================================================================
 * 
 * This controller manages all sleep data operations for authenticated users.
 * It handles CRUD operations for sleep sessions, including retrieval, updates,
 * and secure deletion of sleep data records.
 * 
 * Key Features:
 * - User-specific sleep data management
 * - Date-based sleep session retrieval
 * - Secure sleep data updates with field whitelisting
 * - Password-protected deletion for data safety
 * - Comprehensive ownership validation
 * - Detailed error handling and logging
 * 
 * Security Considerations:
 * - All routes require valid JWT authentication
 * - Ownership validation prevents cross-user data access
 * - Password confirmation required for deletions
 * - Input validation and sanitization
 * - Audit logging for sensitive operations
 * 
 * @author DreamWeaver Development Team
 * @version 1.0.0
 * =============================================================================
 */

// Core Express framework for routing
const express = require('express');
const router = express.Router();

// Security and authentication utilities
const bcrypt = require('bcrypt'); // For password verification during deletions

// Data models
const SleepData = require('../models/SleepData');
const User = require('../models/User');

// Authentication middleware
const verifyToken = require('../middleware/verifyToken');

// Apply JWT verification to all routes in this controller
// This ensures all sleep data operations require authentication
router.use(verifyToken);

/**
 * =============================================================================
 * OWNERSHIP VALIDATION MIDDLEWARE
 * =============================================================================
 * 
 * This middleware ensures that users can only access sleep data that belongs
 * to them. It performs ownership validation by comparing the user ID in the
 * sleep data record with the authenticated user's ID.
 * 
 * Functionality:
 * - Retrieves sleep data by ID from route parameters
 * - Validates ownership against authenticated user
 * - Attaches validated sleep data to request object
 * - Provides consistent error handling for unauthorized access
 * 
 * Usage:
 * - Applied to PUT and DELETE routes that modify specific sleep records
 * - Prevents users from accessing or modifying others' sleep data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * =============================================================================
 */
async function checkOwnership(req, res, next) {
  try {
    // Extract sleep data ID from route parameters
    const sleepDataId = req.params.id;
    
    // Validate the provided sleep data ID format
    if (!sleepDataId || !sleepDataId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid sleep data ID format.' 
      });
    }

    // Attempt to find the sleep data record by ID
    const sleepData = await SleepData.findById(sleepDataId);

    // Return 404 if sleep data record doesn't exist
    if (!sleepData) {
      console.warn(`[SLEEP_DATA] Sleep session not found: ${sleepDataId} requested by ${req.user.username}`);
      return res.status(404).json({ 
        success: false,
        error: 'Sleep session not found.' 
      });
    }

    // Verify ownership - compare sleep data user ID with authenticated user ID
    if (sleepData.user.toString() !== req.user.id.toString()) {
      console.warn(`[SECURITY] Unauthorized sleep data access attempt: ${req.user.username} tried to access sleep data ${sleepDataId}`);
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access. You can only access your own sleep data.' 
      });
    }

    // Attach validated sleep data to request object for downstream handlers
    req.sleepData = sleepData;
    
    // Log successful ownership validation
    console.log(`[SLEEP_DATA] Ownership validated for sleep session ${sleepDataId} by user ${req.user.username}`);
    
    // Continue to next middleware/handler
    next();
  } catch (error) {
    // Log detailed error for debugging
    console.error('[SLEEP_DATA] Ownership check error:', {
      error: error.message,
      sleepDataId: req.params.id,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Pass error to global error handler
    next(error);
  }
}

/**
 * =============================================================================
 * GET /
 * =============================================================================
 * Retrieves all sleep sessions for the authenticated user.
 * 
 * Access Control:
 * - Requires valid JWT token (applied by router middleware)
 * - Users can only access their own sleep data
 * 
 * Query Parameters:
 * - None (returns all user's sleep sessions)
 * 
 * Response:
 * - Success: Array of sleep data objects, sorted by creation date (newest first)
 * - Error: 500 for server errors
 * 
 * Data Relationships:
 * - Includes referenced bedroom data if populated
 * - Contains wake-up events and sleep quality ratings
 * 
 * Performance Notes:
 * - Results are sorted by createdAt in descending order
 * - Consider pagination for users with extensive sleep history
 * =============================================================================
 */
router.get('/', async (req, res, next) => {
  try {
    console.log(`[SLEEP_DATA] Fetching all sleep sessions for user: ${req.user.username}`);
    
    // Find all sleep data records for the authenticated user
    // Sort by creation date descending (most recent first)
    const sleepData = await SleepData.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('bedroom', 'bedroomName description') // Include basic bedroom info
      .populate('user', 'username firstName lastName'); // Include basic user info

    // Log successful retrieval
    console.log(`[SLEEP_DATA] Successfully retrieved ${sleepData.length} sleep sessions for user: ${req.user.username}`);

    res.status(200).json({
      success: true,
      count: sleepData.length,
      data: sleepData
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[SLEEP_DATA] Error fetching sleep sessions:', {
      error: error.message,
      stack: error.stack,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Pass error to global error handler
    next(error);
  }
});

/**
 * =============================================================================
 * GET /:date
 * =============================================================================
 * Retrieves a specific sleep session by date.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only access their own sleep data
 * 
 * Parameters:
 * - date: String in YYYYMMDD format (e.g., "20231225" for December 25, 2023)
 * 
 * Response:
 * - Success: Sleep data object for the specified date
 * - Error: 400 for invalid date format, 404 for no data found, 500 for server errors
 * 
 * Date Handling:
 * - Expects UTC date in YYYYMMDD format
 * - Searches for sleep sessions created within the specified 24-hour period
 * - Accounts for timezone differences by using UTC date ranges
 * 
 * Use Cases:
 * - Mobile app requesting specific day's sleep data
 * - Calendar view showing sleep information for selected dates
 * - Sleep pattern analysis for specific time periods
 * =============================================================================
 */
router.get('/:date', async (req, res, next) => {
  try {
    const dateStr = req.params.date;
    console.log(`[SLEEP_DATA] Fetching sleep session for date: ${dateStr} by user: ${req.user.username}`);

    // Validate date format - must be exactly 8 digits (YYYYMMDD)
    if (!/^\d{8}$/.test(dateStr)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date format. Expected YYYYMMDD (e.g., 20231225).' 
      });
    }

    // Parse the date string into year, month, and day components
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1; // JavaScript months are 0-based
    const day = parseInt(dateStr.slice(6, 8), 10);

    // Validate parsed date components
    if (year < 1900 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date values. Please check year, month, and day.' 
      });
    }

    // Create UTC date range for the entire specified day (midnight to midnight)
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

    // Validate that the created date is valid
    if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date. Please check the date format and values.' 
      });
    }

    // Find sleep data for the user within the specified date range
    const sleepData = await SleepData.findOne({
      user: req.user.id,
      createdAt: { 
        $gte: startOfDay,  // Greater than or equal to start of day
        $lt: endOfDay      // Less than start of next day
      },
    })
    .populate('bedroom', 'bedroomName description') // Include bedroom details
    .populate('user', 'username firstName lastName'); // Include user details

    // Return 404 if no sleep data found for the specified date
    if (!sleepData) {
      console.log(`[SLEEP_DATA] No sleep session found for date: ${dateStr} by user: ${req.user.username}`);
      return res.status(404).json({ 
        success: false,
        error: 'No sleep session found for the specified date.' 
      });
    }

    // Log successful retrieval
    console.log(`[SLEEP_DATA] Sleep session found for date: ${dateStr} by user: ${req.user.username}`);

    res.status(200).json({
      success: true,
      data: sleepData
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[SLEEP_DATA] Error fetching sleep session by date:', {
      error: error.message,
      date: req.params.date,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Pass error to global error handler
    next(error);
  }
});

/**
 * =============================================================================
 * PUT /:id
 * =============================================================================
 * Updates an existing sleep session with new data.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Uses ownership validation middleware
 * - Users can only update their own sleep data
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the sleep session to update
 * 
 * Request Body (all optional):
 * - bedroom: ObjectId reference to a bedroom
 * - sleepyThoughts: String - thoughts before sleeping
 * - wakeUps: Array - wake-up events with quality ratings and notes
 * - cuddleBuddy: String - what the user cuddled with
 * - createdAt: Date - when the sleep session occurred
 * 
 * Field Restrictions:
 * - Only whitelisted fields can be updated for security
 * - User field cannot be changed (ownership immutable)
 * - Unknown fields are automatically filtered out
 * 
 * Response:
 * - Success: Updated sleep data object
 * - Error: 400 for validation errors, 403 for unauthorized access, 404 for not found
 * 
 * Validation:
 * - Mongoose schema validation is applied
 * - Field type checking and constraints are enforced
 * - Invalid data is rejected with detailed error messages
 * =============================================================================
 */
router.put('/:id', checkOwnership, async (req, res, next) => {
  try {
    const updates = req.body;
    console.log(`[SLEEP_DATA] Updating sleep session ${req.params.id} for user: ${req.user.username}`);

    // Define allowed fields that can be updated for security
    // This prevents users from modifying protected fields like user ID
    const allowedUpdates = [
      'bedroom',        // Reference to bedroom where sleep occurred
      'sleepyThoughts', // Pre-sleep thoughts and notes
      'wakeUps',        // Array of wake-up events and quality ratings
      'cuddleBuddy',    // What the user cuddled with during sleep
      'createdAt'       // When the sleep session occurred (for data correction)
    ];

    // Filter out any fields that are not in the allowed list
    // This provides security by preventing modification of sensitive fields
    const filteredUpdates = {};
    let hasValidUpdates = false;

    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
        hasValidUpdates = true;
      } else {
        console.warn(`[SLEEP_DATA] Attempted update to restricted field '${key}' by user: ${req.user.username}`);
      }
    });

    // Check if there are any valid updates to apply
    if (!hasValidUpdates) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid fields provided for update. Allowed fields: ' + allowedUpdates.join(', ')
      });
    }

    // Validate specific field types and constraints
    if (filteredUpdates.bedroom) {
      // Validate bedroom ID format if provided
      if (!filteredUpdates.bedroom.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid bedroom ID format.' 
        });
      }
    }

    if (filteredUpdates.wakeUps) {
      // Validate wake-ups array structure
      if (!Array.isArray(filteredUpdates.wakeUps)) {
        return res.status(400).json({ 
          success: false,
          error: 'Wake-ups must be an array.' 
        });
      }
      
      // Validate each wake-up entry
      for (let i = 0; i < filteredUpdates.wakeUps.length; i++) {
        const wakeUp = filteredUpdates.wakeUps[i];
        if (wakeUp.sleepQuality && (wakeUp.sleepQuality < 1 || wakeUp.sleepQuality > 10)) {
          return res.status(400).json({ 
            success: false,
            error: `Wake-up ${i + 1}: Sleep quality must be between 1 and 10.` 
          });
        }
      }
    }

    if (filteredUpdates.cuddleBuddy) {
      // Validate cuddle buddy enum values
      const validCuddleBuddies = ['none', 'pillow', 'stuffed animal', 'pet', 'person'];
      if (!validCuddleBuddies.includes(filteredUpdates.cuddleBuddy)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid cuddle buddy. Must be one of: ' + validCuddleBuddies.join(', ')
        });
      }
    }

    if (filteredUpdates.createdAt) {
      // Validate date format
      const date = new Date(filteredUpdates.createdAt);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid date format for createdAt.' 
        });
      }
    }

    // Apply the filtered updates to the sleep data document
    Object.assign(req.sleepData, filteredUpdates);

    // Save the updated document with validation
    const updatedSleepData = await req.sleepData.save();

    // Log successful update
    console.log(`[SLEEP_DATA] Sleep session updated successfully: ${req.params.id} by user: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'Sleep session updated successfully.',
      data: updatedSleepData
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[SLEEP_DATA] Error updating sleep session:', {
      error: error.message,
      sleepDataId: req.params.id,
      username: req.user.username,
      updates: Object.keys(req.body),
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
    
    // Pass other errors to global error handler
    next(error);
  }
});

/**
 * =============================================================================
 * DELETE /:id
 * =============================================================================
 * Permanently deletes a sleep session from the database.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Uses ownership validation middleware
 * - Requires password confirmation for additional security
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the sleep session to delete
 * 
 * Request Body:
 * - password: String - user's current password for confirmation
 * 
 * Response:
 * - Success: Confirmation message with deleted session details
 * - Error: 400 for missing password, 401 for wrong password, 403 for unauthorized access
 * 
 * Security Features:
 * - Password verification prevents accidental deletions
 * - Ownership validation ensures users can only delete their own data
 * - Detailed audit logging for security monitoring
 * - Protection against unauthorized data manipulation
 * 
 * Data Integrity:
 * - Deletion is permanent and irreversible
 * - Consider implementing soft deletes for data recovery
 * - Related data cleanup may be needed separately
 * 
 * Warning: This operation cannot be undone!
 * =============================================================================
 */
router.delete('/:id', checkOwnership, async (req, res, next) => {
  try {
    const { password } = req.body;
    console.log(`[SLEEP_DATA] Delete request for sleep session ${req.params.id} by user: ${req.user.username}`);

    // Require password in request body for security confirmation
    if (!password) {
      console.warn(`[SECURITY] Sleep data deletion attempted without password by ${req.user.username}`);
      return res.status(400).json({ 
        success: false,
        error: 'Password required to confirm deletion of sleep session.' 
      });
    }

    // Validate password is a string
    if (typeof password !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be a valid string.' 
      });
    }

    // Fetch the user to verify the provided password
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error(`[SECURITY] User not found during sleep data deletion: ${req.user.id}`);
      return res.status(404).json({ 
        success: false,
        error: 'User not found. Please log in again.' 
      });
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      console.warn(`[SECURITY] Invalid password for sleep data deletion by user: ${req.user.username}`);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid password. Deletion cancelled for security.' 
      });
    }

    // Store sleep session details for response before deletion
    const sleepSessionInfo = {
      id: req.sleepData._id,
      createdAt: req.sleepData.createdAt,
      bedroom: req.sleepData.bedroom,
      wakeUpCount: req.sleepData.wakeUps ? req.sleepData.wakeUps.length : 0
    };

    // Perform the deletion
    await SleepData.findByIdAndDelete(req.sleepData._id);

    // Log successful deletion for audit trail
    console.log(`[SLEEP_DATA] Sleep session deleted successfully: ${req.sleepData._id} by user ${req.user.username} at ${new Date().toISOString()}`);

    res.status(200).json({ 
      success: true,
      message: 'Sleep session deleted successfully.',
      deletedSession: sleepSessionInfo
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[SLEEP_DATA] Error deleting sleep session:', {
      error: error.message,
      stack: error.stack,
      sleepDataId: req.params.id,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Pass error to global error handler
    next(error);
  }
});

/**
 * =============================================================================
 * MODULE EXPORTS
 * =============================================================================
 * Export the router for use in the main application.
 * This router handles all sleep data operations for authenticated users.
 * =============================================================================
 */
module.exports = router;
