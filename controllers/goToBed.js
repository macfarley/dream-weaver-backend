/**
 * =============================================================================
 * GO TO BED CONTROLLER - DreamWeaver Backend
 * =============================================================================
 * 
 * This controller manages the sleep session lifecycle for authenticated users.
 * It handles the creation of new sleep sessions and the recording of wake-up
 * events during those sessions.
 * 
 * Key Features:
 * - Sleep session initiation with pre-sleep data
 * - Wake-up event recording with quality ratings and notes
 * - Active session validation to prevent overlapping sessions
 * - Comprehensive sleep tracking throughout the night
 * - Detailed error handling and validation
 * 
 * Sleep Session Lifecycle:
 * 1. User goes to bed → POST / (creates new sleep session)
 * 2. User wakes up → POST /wakeup (adds wake-up event)
 * 3. If going back to bed → POST /wakeup with finishedSleeping=false
 * 4. Final wake-up → POST /wakeup with finishedSleeping=true
 * 
 * Security Considerations:
 * - All routes require valid JWT authentication
 * - Users can only create/modify their own sleep sessions
 * - Input validation and sanitization for all fields
 * - Audit logging for sleep data creation and updates
 * 
 * Data Relationships:
 * - Links to User model (session owner)
 * - Links to Bedroom model (sleep location)
 * - Contains array of wake-up events with ratings and notes
 * 
 * @author DreamWeaver Development Team
 * @version 1.0.0
 * =============================================================================
 */

// Core Express framework for routing
const express = require('express');
const router = express.Router();

// Data models
const SleepData = require('../models/SleepData');

// Authentication middleware
const verifyToken = require('../middleware/verifyToken');

/**
 * =============================================================================
 * POST /
 * =============================================================================
 * Initiates a new sleep session for the authenticated user.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Creates sleep session owned by authenticated user
 * 
 * Request Body:
 * - bedroom: ObjectId (required) - reference to the bedroom being used
 * - cuddleBuddy: String (optional) - what the user is cuddling with
 * - sleepyThoughts: String (optional) - pre-sleep thoughts and notes
 * 
 * Response:
 * - Success: Created sleep session object with generated ID
 * - Error: 400 for active session exists or validation errors, 500 for server errors
 * 
 * Business Rules:
 * - Users can only have one active sleep session at a time
 * - Active session is defined as having no wake-ups OR the LAST wake-up has finishedSleeping=false
 * - New session starts with empty wakeUps array
 * 
 * Use Cases:
 * - Mobile app "Going to Bed" button
 * - Sleep tracking initiation
 * - Pre-sleep data collection
 * =============================================================================
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log(`[SLEEP_SESSION] Starting new sleep session for user: ${req.user.username}`);
    
    // Extract and validate fields from request body
    const { bedroom, cuddleBuddy, sleepyThoughts } = req.body;

    // Validate required bedroom field
    if (!bedroom) {
      return res.status(400).json({ 
        success: false,
        message: 'Bedroom is required to start a sleep session.' 
      });
    }

    // Validate bedroom ID format
    if (!bedroom.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid bedroom ID format.' 
      });
    }

    // Validate cuddleBuddy enum if provided
    if (cuddleBuddy) {
      const validCuddleBuddies = ['none', 'pillow', 'stuffed animal', 'pet', 'person'];
      if (!validCuddleBuddies.includes(cuddleBuddy)) {
        return res.status(400).json({ 
          success: false,
          message: `Invalid cuddle buddy. Must be one of: ${validCuddleBuddies.join(', ')}` 
        });
      }
    }

    // Check for any existing active sleep session
    // An active session is one where:
    // 1. No wake-ups yet (just went to bed), OR
    // 2. The LAST wake-up has finishedSleeping: false (still in session)
    const recentSessions = await SleepData.find({
      user: req.user.id
    }).sort({ createdAt: -1 }).limit(5); // Get 5 most recent sessions to check
    
    let existingActiveSession = null;
    
    for (const session of recentSessions) {
      if (session.wakeUps.length === 0) {
        // No wake-ups yet - this is definitely an active session
        existingActiveSession = session;
        break;
      } else {
        // Check if the LAST wake-up has finishedSleeping: false
        const lastWakeUp = session.wakeUps[session.wakeUps.length - 1];
        if (lastWakeUp && lastWakeUp.finishedSleeping === false) {
          // Last wake-up is not marked as finished - session is still active
          existingActiveSession = session;
          break;
        }
      }
      // If we get here, this session is finished (last wake-up has finishedSleeping: true)
      // Continue to check older sessions
    }

    if (existingActiveSession) {
      const sessionStatus = existingActiveSession.wakeUps.length === 0 
        ? 'no wake-ups recorded yet' 
        : `last wake-up not marked as finished (${existingActiveSession.wakeUps.length} wake-ups total)`;
        
      console.log(`[SLEEP_SESSION] User ${req.user.username} has active session: ${existingActiveSession._id} (${sessionStatus})`);
      
      // Populate bedroom and user data for the active session
      await existingActiveSession.populate('bedroom', 'bedroomName description');
      await existingActiveSession.populate('user', 'username firstName lastName');
      
      return res.status(409).json({ 
        success: false,
        error: 'ACTIVE_SESSION_EXISTS',
        message: 'You already have an active sleep session. Redirecting to wake-up page.',
        redirectTo: '/gotobed/wakeup',
        activeSession: {
          id: existingActiveSession._id,
          createdAt: existingActiveSession.createdAt,
          bedroom: existingActiveSession.bedroom,
          user: existingActiveSession.user,
          cuddleBuddy: existingActiveSession.cuddleBuddy,
          sleepyThoughts: existingActiveSession.sleepyThoughts,
          wakeUpCount: existingActiveSession.wakeUps.length,
          status: sessionStatus,
          lastWakeUp: existingActiveSession.wakeUps.length > 0 
            ? existingActiveSession.wakeUps[existingActiveSession.wakeUps.length - 1]
            : null
        }
      });
    }

    // Create new sleep data document
    const newSleepSession = new SleepData({
      user: req.user.id,
      bedroom: bedroom,
      cuddleBuddy: cuddleBuddy || 'none', // Default to 'none' if not specified
      sleepyThoughts: sleepyThoughts || '', // Default to empty string
      wakeUps: [], // Initialize empty wake-ups array
      createdAt: new Date() // Explicitly set creation time
    });

    // Save the new sleep session to database with validation
    const savedSleepSession = await newSleepSession.save();

    // Populate bedroom reference for response
    await savedSleepSession.populate('bedroom', 'bedroomName description');

    // Log successful session creation
    console.log(`[SLEEP_SESSION] Successfully created sleep session ${savedSleepSession._id} for user: ${req.user.username}`);

    // Return the newly created sleep session
    res.status(201).json({
      success: true,
      message: 'Sleep session started successfully. Sweet dreams!',
      data: savedSleepSession
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[SLEEP_SESSION] Error starting sleep session:', {
      error: error.message,
      stack: error.stack,
      username: req.user.username,
      requestData: req.body,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed: ' + validationErrors.join(', ')
      });
    }
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      message: 'Server error while starting sleep session. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * POST /wakeup
 * =============================================================================
 * Records a wake-up event for the user's active sleep session.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Can only add wake-ups to user's own active sleep session
 * 
 * Request Body:
 * - sleepQuality: Number (required) - rating from 1-10
 * - dreamJournal: String (optional) - dream notes and experiences
 * - awakenAt: Date (optional) - when the user woke up (defaults to now)
 * - finishedSleeping: Boolean (optional) - whether this is the final wake-up
 * - backToBedAt: Date (optional) - when user went back to bed (if applicable)
 * 
 * Response:
 * - Success: Updated sleep session with new wake-up event
 * - Error: 400 for validation errors, 404 for no active session, 500 for server errors
 * 
 * Business Rules:
 * - Must have an active sleep session to add wake-ups
 * - Sleep quality must be between 1 and 10
 * - If finishedSleeping=true, this ends the sleep session
 * - If finishedSleeping=false, user can go back to bed
 * 
 * Use Cases:
 * - Recording middle-of-night wake-ups
 * - Final morning wake-up with quality rating
 * - Dream journaling after waking
 * - Multiple wake-ups throughout the night
 * =============================================================================
 */
router.post('/wakeup', verifyToken, async (req, res) => {
  try {
    console.log(`[SLEEP_SESSION] Recording wake-up event for user: ${req.user.username}`);
    
    // Extract and validate wake-up details from request body
    const {
      sleepQuality,
      dreamJournal,
      awakenAt,
      finishedSleeping,
      backToBedAt,
    } = req.body;

    // Validate required sleep quality field
    if (sleepQuality === undefined || sleepQuality === null) {
      return res.status(400).json({ 
        success: false,
        message: 'Sleep quality rating is required for wake-up events.' 
      });
    }

    // Validate sleep quality range (1-10)
    if (typeof sleepQuality !== 'number' || sleepQuality < 1 || sleepQuality > 10) {
      return res.status(400).json({ 
        success: false,
        message: 'Sleep quality must be a number between 1 and 10.' 
      });
    }

    // Validate awakenAt date if provided
    if (awakenAt && isNaN(new Date(awakenAt).getTime())) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid awakening time format.' 
      });
    }

    // Validate backToBedAt date if provided
    if (backToBedAt && isNaN(new Date(backToBedAt).getTime())) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid back-to-bed time format.' 
      });
    }

    // Find the user's most recent active sleep session
    // Active session: either no wake-ups yet, or latest wake-up has finishedSleeping=false
    const recentSessions = await SleepData.find({
      user: req.user.id
    }).sort({ createdAt: -1 }).limit(5); // Get 5 most recent sessions to check
    
    let activeSleepSession = null;
    
    for (const session of recentSessions) {
      if (session.wakeUps.length === 0) {
        // No wake-ups yet - this is definitely an active session
        activeSleepSession = session;
        break;
      } else {
        // Check if the LAST wake-up has finishedSleeping: false
        const lastWakeUp = session.wakeUps[session.wakeUps.length - 1];
        if (lastWakeUp && lastWakeUp.finishedSleeping === false) {
          // Last wake-up is not marked as finished - session is still active
          activeSleepSession = session;
          break;
        }
      }
      // If we get here, this session is finished (last wake-up has finishedSleeping: true)
      // Continue to check older sessions
    }

    if (!activeSleepSession) {
      console.warn(`[SLEEP_SESSION] No active sleep session found for wake-up by user: ${req.user.username}`);
      console.log(`[SLEEP_SESSION] Recent sessions checked: ${recentSessions.length}, all appear to be finished`);
      return res.status(404).json({ 
        success: false,
        message: 'No active sleep session found. Please start a new sleep session first.' 
      });
    }

    // Build the wake-up event object with validated data
    const wakeUpEvent = {
      sleepQuality: sleepQuality,
      dreamJournal: dreamJournal || '', // Default to empty string if not provided
      awakenAt: awakenAt ? new Date(awakenAt) : new Date(), // Use provided time or current time
      finishedSleeping: Boolean(finishedSleeping), // Ensure boolean value
      backToBedAt: backToBedAt ? new Date(backToBedAt) : null // Use provided time or null
    };

    // Validate logical consistency
    if (wakeUpEvent.finishedSleeping && wakeUpEvent.backToBedAt) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot set back-to-bed time when finished sleeping.' 
      });
    }

    if (!wakeUpEvent.finishedSleeping && !wakeUpEvent.backToBedAt) {
      // If not finished sleeping but no back-to-bed time, set it to a reasonable default
      wakeUpEvent.backToBedAt = new Date(wakeUpEvent.awakenAt.getTime() + (30 * 60 * 1000)); // 30 minutes later
    }

    // Add the wake-up event to the sleep session
    activeSleepSession.wakeUps.push(wakeUpEvent);

    // Save the updated sleep session with validation
    const updatedSleepSession = await activeSleepSession.save();

    // Populate references for response
    await updatedSleepSession.populate('bedroom', 'bedroomName description');
    await updatedSleepSession.populate('user', 'username firstName lastName');

    // Log successful wake-up recording
    const wakeUpIndex = updatedSleepSession.wakeUps.length;
    console.log(`[SLEEP_SESSION] Wake-up event #${wakeUpIndex} recorded for session ${updatedSleepSession._id} by user: ${req.user.username}, finished: ${wakeUpEvent.finishedSleeping}`);

    // Return the updated sleep session
    res.status(200).json({
      success: true,
      message: wakeUpEvent.finishedSleeping 
        ? 'Wake-up recorded and sleep session completed!'
        : 'Wake-up recorded successfully.',
      data: updatedSleepSession,
      wakeUpCount: wakeUpIndex,
      sessionCompleted: wakeUpEvent.finishedSleeping
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[SLEEP_SESSION] Error recording wake-up:', {
      error: error.message,
      stack: error.stack,
      username: req.user.username,
      requestData: req.body,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed: ' + validationErrors.join(', ')
      });
    }
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      message: 'Server error while recording wake-up. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * GET /active
 * =============================================================================
 * Checks if the authenticated user has an active sleep session.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Returns only the user's own active session
 * 
 * Response:
 * - Success: Active session details or null if no active session
 * - Error: 500 for server errors
 * 
 * Business Rules:
 * - Active session is defined as having no wake-ups OR the LAST wake-up has finishedSleeping=false
 * - Returns full session details for frontend navigation
 * 
 * Use Cases:
 * - Frontend checking if user should be redirected to wake-up page
 * - Navigation logic for "Go to Bed" button
 * - Session state management
 * =============================================================================
 */
router.get('/active', verifyToken, async (req, res) => {
  try {
    console.log(`[SLEEP_SESSION] Checking for active session for user: ${req.user.username}`);
    
    // Find the user's most recent sessions to check for active ones
    const recentSessions = await SleepData.find({
      user: req.user.id
    }).sort({ createdAt: -1 }).limit(5)
      .populate('bedroom', 'bedroomName description');
    
    let activeSession = null;
    
    for (const session of recentSessions) {
      if (session.wakeUps.length === 0) {
        // No wake-ups yet - this is definitely an active session
        activeSession = session;
        break;
      } else {
        // Check if the LAST wake-up has finishedSleeping: false
        const lastWakeUp = session.wakeUps[session.wakeUps.length - 1];
        if (lastWakeUp && lastWakeUp.finishedSleeping === false) {
          // Last wake-up is not marked as finished - session is still active
          activeSession = session;
          break;
        }
      }
    }

    if (activeSession) {
      const sessionStatus = activeSession.wakeUps.length === 0 
        ? 'sleeping (no wake-ups yet)' 
        : `awake (${activeSession.wakeUps.length} wake-ups, not finished)`;
        
      console.log(`[SLEEP_SESSION] Active session found for user ${req.user.username}: ${activeSession._id} (${sessionStatus})`);
      
      res.status(200).json({
        success: true,
        hasActiveSession: true,
        activeSession: {
          id: activeSession._id,
          createdAt: activeSession.createdAt,
          bedroom: activeSession.bedroom,
          cuddleBuddy: activeSession.cuddleBuddy,
          sleepyThoughts: activeSession.sleepyThoughts,
          wakeUpCount: activeSession.wakeUps.length,
          status: sessionStatus,
          lastWakeUp: activeSession.wakeUps.length > 0 ? activeSession.wakeUps[activeSession.wakeUps.length - 1] : null
        },
        redirectTo: '/gotobed/wakeup'
      });
    } else {
      console.log(`[SLEEP_SESSION] No active session found for user: ${req.user.username}`);
      res.status(200).json({
        success: true,
        hasActiveSession: false,
        activeSession: null
      });
    }
  } catch (error) {
    console.error('[SLEEP_SESSION] Error checking for active session:', {
      error: error.message,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while checking for active session.' 
    });
  }
});

/**
 * =============================================================================
 * MODULE EXPORTS
 * =============================================================================
 * Export the router for use in the main application.
 * This router handles sleep session lifecycle management for authenticated users.
 * =============================================================================
 */
module.exports = router;
