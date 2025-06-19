/**
 * =============================================================================
 * BEDROOMS CONTROLLER - DreamWeaver Backend
 * =============================================================================
 * 
 * This controller manages bedroom configuration data for authenticated users.
 * It handles CRUD operations for bedroom settings, including environmental
 * conditions, comfort preferences, and sleep optimization parameters.
 * 
 * Key Features:
 * - User-specific bedroom management
 * - Environmental condition tracking (light, noise, temperature)
 * - Bedroom creation, retrieval, updates, and deletion
 * - Data validation and constraint enforcement
 * - Password-protected deletion for data safety
 * - Comprehensive ownership validation
 * 
 * Security Considerations:
 * - All routes require valid JWT authentication
 * - Ownership validation prevents cross-user data access
 * - Password confirmation required for deletions
 * - Input validation and sanitization
 * - Audit logging for sensitive operations
 * - Protection against deletion of last bedroom
 * 
 * Data Validation:
 * - Light levels: pitch black, very dim, dim, normal, bright, daylight
 * - Noise levels: silent, very quiet, quiet, moderate, loud, very loud
 * - Temperature: 50-100°F range validation
 * - Required field validation via Mongoose schema
 * 
 * @author DreamWeaver Development Team
 * @version 1.0.0
 * =============================================================================
 */

// Core Express framework for routing
const express = require('express');
const router = express.Router();

// Data models
const Bedroom = require('../models/Bedroom');
const User = require('../models/User');

// Security and authentication utilities
const bcrypt = require('bcrypt'); // For password verification during deletions
const verifyToken = require('../middleware/verifyToken'); // JWT verification

// Apply JWT verification to all routes in this controller
// This ensures all bedroom operations require authentication
router.use(verifyToken);

/**
 * =============================================================================
 * VALIDATION CONSTANTS
 * =============================================================================
 * These constants define the allowed enum values for bedroom environment
 * settings. They must match the schema definitions in the Bedroom model.
 * =============================================================================
 */

// Valid light level options for bedroom environment
const VALID_LIGHT_LEVELS = [
  'pitch black',  // Complete darkness
  'very dim',     // Minimal light
  'dim',          // Low light
  'normal',       // Standard room lighting
  'bright',       // Well-lit room
  'daylight'      // Natural or very bright lighting
];

// Valid noise level options for bedroom environment
const VALID_NOISE_LEVELS = [
  'silent',       // No noise
  'very quiet',   // Minimal ambient noise
  'quiet',        // Low noise level
  'moderate',     // Average noise level
  'loud',         // High noise level
  'very loud'     // Very high noise level
];

// Temperature range constants (Fahrenheit)
const MIN_TEMPERATURE = 50; // Minimum allowed temperature
const MAX_TEMPERATURE = 100; // Maximum allowed temperature

/**
 * =============================================================================
 * GET /
 * =============================================================================
 * Retrieves all bedrooms belonging to the authenticated user.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only access their own bedrooms
 * 
 * Response:
 * - Success: Array of bedroom objects with complete configuration data
 * - Error: 404 if no bedrooms found, 500 for server errors
 * 
 * Data Included:
 * - Bedroom identification and naming
 * - Environmental settings (light, noise, temperature)
 * - Comfort preferences and notes
 * - Creation and update timestamps
 * 
 * Use Cases:
 * - Mobile app displaying user's bedroom list
 * - Settings dashboard showing all configured spaces
 * - Sleep data analysis requiring bedroom context
 * =============================================================================
 */
router.get('/', async (req, res) => {
  try {
    console.log(`[BEDROOMS] Fetching all bedrooms for user: ${req.user.username}`);
    
    // Find all bedrooms owned by the authenticated user
    const bedrooms = await Bedroom.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    // Check if user has any bedrooms
    if (!bedrooms || bedrooms.length === 0) {
      console.log(`[BEDROOMS] No bedrooms found for user: ${req.user.username}`);
      return res.status(404).json({ 
        success: false,
        message: 'No bedrooms found. Create your first bedroom to get started.' 
      });
    }

    // Log successful retrieval
    console.log(`[BEDROOMS] Successfully retrieved ${bedrooms.length} bedrooms for user: ${req.user.username}`);

    // Return the bedroom list with metadata
    res.status(200).json({
      success: true,
      count: bedrooms.length,
      data: bedrooms
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[BEDROOMS] Error fetching bedrooms:', {
      error: error.message,
      stack: error.stack,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve bedrooms. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * GET /by-name/:bedroomName
 * =============================================================================
 * Retrieves a specific bedroom by its name for the authenticated user.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only access their own bedrooms
 * 
 * Parameters:
 * - bedroomName: String - the name of the bedroom to retrieve
 * 
 * Response:
 * - Success: Bedroom object with complete configuration data
 * - Error: 404 if bedroom not found, 500 for server errors
 * 
 * Use Cases:
 * - Quick bedroom lookup by name for sleep session creation
 * - API endpoints that prefer human-readable identifiers
 * - Mobile app navigation using bedroom names
 * 
 * Note: Bedroom names should be unique per user for this endpoint to work reliably
 * =============================================================================
 */
router.get('/by-name/:bedroomName', async (req, res) => {
  try {
    const bedroomName = req.params.bedroomName;
    console.log(`[BEDROOMS] Fetching bedroom by name: '${bedroomName}' for user: ${req.user.username}`);
    
    // Validate bedroom name parameter
    if (!bedroomName || bedroomName.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Bedroom name is required and cannot be empty.' 
      });
    }

    // Find bedroom by owner and name (case-sensitive match)
    const bedroom = await Bedroom.findOne({
      ownerId: req.user.id,
      bedroomName: bedroomName.trim()
    });

    // Check if bedroom was found
    if (!bedroom) {
      console.log(`[BEDROOMS] Bedroom not found by name: '${bedroomName}' for user: ${req.user.username}`);
      return res.status(404).json({ 
        success: false,
        message: `Bedroom '${bedroomName}' not found.` 
      });
    }

    // Log successful retrieval
    console.log(`[BEDROOMS] Successfully retrieved bedroom by name: '${bedroomName}' for user: ${req.user.username}`);

    // Return the bedroom data
    res.status(200).json({
      success: true,
      data: bedroom
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[BEDROOMS] Error fetching bedroom by name:', {
      error: error.message,
      bedroomName: req.params.bedroomName,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve bedroom. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * GET /:id
 * =============================================================================
 * Retrieves a specific bedroom by its MongoDB ObjectId.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only access their own bedrooms
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the bedroom to retrieve
 * 
 * Response:
 * - Success: Bedroom object with complete configuration data
 * - Error: 400 for invalid ID format, 404 if not found, 500 for server errors
 * 
 * Use Cases:
 * - Direct bedroom access using database ID
 * - REST API standard ID-based retrieval
 * - Sleep session creation referencing specific bedroom
 * =============================================================================
 */
router.get('/:id', async (req, res) => {
  try {
    const bedroomId = req.params.id;
    console.log(`[BEDROOMS] Fetching bedroom by ID: ${bedroomId} for user: ${req.user.username}`);
    
    // Validate the provided bedroom ID format
    if (!bedroomId || !bedroomId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid bedroom ID format.' 
      });
    }

    // Find bedroom by MongoDB ObjectId
    const bedroom = await Bedroom.findById(bedroomId);

    // Check if bedroom exists and verify ownership
    if (!bedroom) {
      console.log(`[BEDROOMS] Bedroom not found by ID: ${bedroomId} for user: ${req.user.username}`);
      return res.status(404).json({ 
        success: false,
        message: 'Bedroom not found.' 
      });
    }

    // Verify that the bedroom belongs to the authenticated user
    if (bedroom.ownerId.toString() !== req.user.id) {
      console.warn(`[SECURITY] Unauthorized bedroom access attempt: ${req.user.username} tried to access bedroom ${bedroomId}`);
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only access your own bedrooms.' 
      });
    }

    // Log successful retrieval
    console.log(`[BEDROOMS] Successfully retrieved bedroom by ID: ${bedroomId} for user: ${req.user.username}`);

    // Return the bedroom data
    res.status(200).json({
      success: true,
      data: bedroom
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[BEDROOMS] Error fetching bedroom by ID:', {
      error: error.message,
      bedroomId: req.params.id,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve bedroom. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * VALIDATION HELPER FUNCTIONS
 * =============================================================================
 * These functions provide reusable validation logic for bedroom environment
 * settings. They ensure data consistency and provide detailed error messages.
 * =============================================================================
 */

/**
 * Validates light level against allowed enum values
 * @param {string} lightLevel - The light level to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
function validateLightLevel(lightLevel) {
  if (!lightLevel) return { isValid: true, error: null }; // Optional field
  
  if (typeof lightLevel !== 'string') {
    return { isValid: false, error: 'Light level must be a string.' };
  }
  
  if (!VALID_LIGHT_LEVELS.includes(lightLevel)) {
    return { 
      isValid: false, 
      error: `Light level must be one of: ${VALID_LIGHT_LEVELS.join(', ')}` 
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validates noise level against allowed enum values
 * @param {string} noiseLevel - The noise level to validate
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
function validateNoiseLevel(noiseLevel) {
  if (!noiseLevel) return { isValid: true, error: null }; // Optional field
  
  if (typeof noiseLevel !== 'string') {
    return { isValid: false, error: 'Noise level must be a string.' };
  }
  
  if (!VALID_NOISE_LEVELS.includes(noiseLevel)) {
    return { 
      isValid: false, 
      error: `Noise level must be one of: ${VALID_NOISE_LEVELS.join(', ')}` 
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validates temperature within acceptable range
 * @param {number} temperature - The temperature to validate (Fahrenheit)
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
function validateTemperature(temperature) {
  if (temperature === undefined || temperature === null) {
    return { isValid: true, error: null }; // Optional field
  }
  
  if (typeof temperature !== 'number' || isNaN(temperature)) {
    return { isValid: false, error: 'Temperature must be a valid number.' };
  }
  
  if (temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
    return { 
      isValid: false, 
      error: `Temperature must be between ${MIN_TEMPERATURE} and ${MAX_TEMPERATURE} degrees Fahrenheit.` 
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * =============================================================================
 * POST /new
 * =============================================================================
 * Creates a new bedroom configuration for the authenticated user.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Creates bedroom owned by authenticated user
 * 
 * Request Body:
 * - bedroomName: String (required) - unique name for the bedroom
 * - description: String (optional) - bedroom description
 * - lightLevel: String (optional) - from VALID_LIGHT_LEVELS enum
 * - noiseLevel: String (optional) - from VALID_NOISE_LEVELS enum
 * - temperature: Number (optional) - temperature in Fahrenheit (50-100)
 * - Additional fields as defined in Bedroom schema
 * 
 * Response:
 * - Success: Created bedroom object with generated ID
 * - Error: 400 for validation errors, 500 for server errors
 * 
 * Validation:
 * - All enum values are validated against predefined constants
 * - Temperature is constrained to reasonable range
 * - Required fields are enforced by Mongoose schema
 * - Duplicate bedroom names per user are allowed (users may have multiple "Bedroom" entries)
 * =============================================================================
 */
router.post('/new', async (req, res) => {
  try {
    console.log(`[BEDROOMS] Creating new bedroom for user: ${req.user.username}`);
    
    // Extract and validate request body fields
    const { lightLevel, noiseLevel, temperature, bedroomName } = req.body;
    
    // Validate required bedroom name
    if (!bedroomName || typeof bedroomName !== 'string' || bedroomName.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Bedroom name is required and must be a non-empty string.' 
      });
    }

    // Validate light level if provided
    const lightValidation = validateLightLevel(lightLevel);
    if (!lightValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: lightValidation.error 
      });
    }

    // Validate noise level if provided
    const noiseValidation = validateNoiseLevel(noiseLevel);
    if (!noiseValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: noiseValidation.error 
      });
    }

    // Validate temperature if provided
    const tempValidation = validateTemperature(temperature);
    if (!tempValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: tempValidation.error 
      });
    }

    // Create new bedroom document with validated data
    const newBedroom = new Bedroom({
      ownerId: req.user.id, // Associate with authenticated user
      ...req.body           // Spread all provided fields
    });

    // Save the bedroom to database with mongoose validation
    const savedBedroom = await newBedroom.save();

    // Log successful creation
    console.log(`[BEDROOMS] Successfully created bedroom '${savedBedroom.bedroomName}' for user: ${req.user.username}`);

    // Return the created bedroom with success status
    res.status(201).json({
      success: true,
      message: 'Bedroom created successfully.',
      data: savedBedroom
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[BEDROOMS] Error creating bedroom:', {
      error: error.message,
      stack: error.stack,
      username: req.user.username,
      bedroomData: req.body,
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
    
    // Handle duplicate key errors (if unique constraints exist)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'A bedroom with these details already exists.' 
      });
    }
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      message: 'Failed to create bedroom. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * PUT /:id
 * =============================================================================
 * Updates an existing bedroom configuration.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only update their own bedrooms
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the bedroom to update
 * 
 * Request Body (all optional):
 * - bedroomName: String - new bedroom name
 * - description: String - updated description
 * - lightLevel: String - from VALID_LIGHT_LEVELS enum
 * - noiseLevel: String - from VALID_NOISE_LEVELS enum
 * - temperature: Number - temperature in Fahrenheit (50-100)
 * - Additional fields as defined in Bedroom schema
 * 
 * Response:
 * - Success: Updated bedroom object
 * - Error: 400 for validation errors, 403 for unauthorized access, 404 for not found
 * 
 * Automatic Fields:
 * - lastUpdatedAt: Automatically set to current timestamp
 * - ownerId: Cannot be changed (ownership immutable)
 * =============================================================================
 */
router.put('/:id', async (req, res) => {
  try {
    const bedroomId = req.params.id;
    console.log(`[BEDROOMS] Updating bedroom ${bedroomId} for user: ${req.user.username}`);
    
    // Validate the provided bedroom ID format
    if (!bedroomId || !bedroomId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid bedroom ID format.' 
      });
    }

    // Extract and validate request body fields
    const { lightLevel, noiseLevel, temperature } = req.body;

    // Validate light level if provided in update
    const lightValidation = validateLightLevel(lightLevel);
    if (!lightValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: lightValidation.error 
      });
    }

    // Validate noise level if provided in update
    const noiseValidation = validateNoiseLevel(noiseLevel);
    if (!noiseValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: noiseValidation.error 
      });
    }

    // Validate temperature if provided in update
    const tempValidation = validateTemperature(temperature);
    if (!tempValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: tempValidation.error 
      });
    }

    // Find the bedroom by ID first to check ownership
    const bedroom = await Bedroom.findById(bedroomId);

    // Check if bedroom exists
    if (!bedroom) {
      console.log(`[BEDROOMS] Bedroom not found for update: ${bedroomId} by user: ${req.user.username}`);
      return res.status(404).json({ 
        success: false,
        message: 'Bedroom not found.' 
      });
    }

    // Verify ownership before allowing update
    if (bedroom.ownerId.toString() !== req.user.id) {
      console.warn(`[SECURITY] Unauthorized bedroom update attempt: ${req.user.username} tried to update bedroom ${bedroomId}`);
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only update your own bedrooms.' 
      });
    }

    // Prevent ownerId changes for security
    const updateData = { ...req.body };
    delete updateData.ownerId; // Remove if present to prevent ownership changes
    
    // Apply updates to the bedroom document
    Object.assign(bedroom, updateData);
    
    // Update the lastUpdatedAt timestamp
    bedroom.lastUpdatedAt = new Date();

    // Save the updated bedroom with validation
    const updatedBedroom = await bedroom.save();

    // Log successful update
    console.log(`[BEDROOMS] Successfully updated bedroom '${updatedBedroom.bedroomName}' for user: ${req.user.username}`);

    // Return the updated bedroom
    res.status(200).json({
      success: true,
      message: 'Bedroom updated successfully.',
      data: updatedBedroom
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[BEDROOMS] Error updating bedroom:', {
      error: error.message,
      stack: error.stack,
      bedroomId: req.params.id,
      username: req.user.username,
      updateData: req.body,
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
      message: 'Failed to update bedroom. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * DELETE /:id
 * =============================================================================
 * Permanently deletes a bedroom configuration from the database.
 * 
 * Access Control:
 * - Requires valid JWT token
 * - Users can only delete their own bedrooms
 * - Requires password confirmation for security
 * 
 * Parameters:
 * - id: MongoDB ObjectId of the bedroom to delete
 * 
 * Request Body:
 * - password: String - user's current password for confirmation
 * 
 * Safety Measures:
 * - Prevents deletion of user's last bedroom (business rule)
 * - Requires password confirmation to prevent accidental deletions
 * - Validates ownership before deletion
 * 
 * Response:
 * - Success: Confirmation message with deleted bedroom details
 * - Error: 400 for validation/safety violations, 401 for wrong password, 403 for unauthorized access
 * 
 * Data Integrity:
 * - Consider impact on related sleep data before deletion
 * - May need cascade deletion or reference updates
 * - Deletion is permanent and irreversible
 * 
 * Warning: This operation cannot be undone!
 * =============================================================================
 */
router.delete('/:id', async (req, res) => {
  try {
    const bedroomId = req.params.id;
    const { password } = req.body;
    console.log(`[BEDROOMS] Delete request for bedroom ${bedroomId} by user: ${req.user.username}`);

    // Validate the provided bedroom ID format
    if (!bedroomId || !bedroomId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid bedroom ID format.' 
      });
    }

    // Require password for deletion confirmation
    if (!password) {
      console.warn(`[SECURITY] Bedroom deletion attempted without password by ${req.user.username}`);
      return res.status(400).json({ 
        success: false,
        message: 'Password required to confirm bedroom deletion.' 
      });
    }

    // Validate password is a string
    if (typeof password !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be a valid string.' 
      });
    }

    // Fetch the user to verify password
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error(`[SECURITY] User not found during bedroom deletion: ${req.user.id}`);
      return res.status(404).json({ 
        success: false,
        message: 'User not found. Please log in again.' 
      });
    }

    // Verify the provided password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      console.warn(`[SECURITY] Invalid password for bedroom deletion by user: ${req.user.username}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid password. Deletion cancelled for security.' 
      });
    }

    // Count user's total bedrooms to enforce business rule
    const bedroomCount = await Bedroom.countDocuments({ ownerId: req.user.id });
    if (bedroomCount <= 1) {
      console.warn(`[BUSINESS_RULE] Attempt to delete last bedroom by user: ${req.user.username}`);
      return res.status(400).json({ 
        success: false,
        message: 'You cannot delete your last bedroom. Users must have at least one bedroom configured.' 
      });
    }

    // Find the bedroom to delete and verify ownership
    const bedroom = await Bedroom.findById(bedroomId);

    // Check if bedroom exists
    if (!bedroom) {
      console.log(`[BEDROOMS] Bedroom not found for deletion: ${bedroomId} by user: ${req.user.username}`);
      return res.status(404).json({ 
        success: false,
        message: 'Bedroom not found.' 
      });
    }

    // Verify ownership
    if (bedroom.ownerId.toString() !== req.user.id) {
      console.warn(`[SECURITY] Unauthorized bedroom deletion attempt: ${req.user.username} tried to delete bedroom ${bedroomId}`);
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only delete your own bedrooms.' 
      });
    }

    // Store bedroom details for response before deletion
    const bedroomInfo = {
      id: bedroom._id,
      name: bedroom.bedroomName,
      description: bedroom.description,
      createdAt: bedroom.createdAt
    };

    // Perform the deletion
    await bedroom.deleteOne();

    // Log successful deletion for audit trail
    console.log(`[BEDROOMS] Bedroom deleted successfully: '${bedroomInfo.name}' (${bedroomInfo.id}) by user ${req.user.username} at ${new Date().toISOString()}`);

    // Return success confirmation
    res.status(200).json({ 
      success: true,
      message: `Bedroom '${bedroomInfo.name}' has been permanently deleted.`,
      deletedBedroom: bedroomInfo
    });
  } catch (error) {
    // Log detailed error for debugging
    console.error('[BEDROOMS] Error deleting bedroom:', {
      error: error.message,
      stack: error.stack,
      bedroomId: req.params.id,
      username: req.user.username,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error message for security
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete bedroom. Please try again later.' 
    });
  }
});

/**
 * =============================================================================
 * MODULE EXPORTS
 * =============================================================================
 * Export the router for use in the main application.
 * This router handles all bedroom configuration operations for authenticated users.
 * =============================================================================
 */
module.exports = router;
