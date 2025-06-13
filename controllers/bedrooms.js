const express = require('express');
const router = express.Router();
const Bedroom = require('../models/Bedroom');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const verifyToken = require('../middleware/verifyToken');

// Middleware: Require authentication for all bedroom routes
router.use(verifyToken);

// Allowed enum values for validation (must match Bedroom schema)
const validLightLevels = ['pitch black', 'very dim', 'dim', 'normal', 'bright', 'daylight'];
const validNoiseLevels = ['silent', 'very quiet', 'quiet', 'moderate', 'loud', 'very loud'];

/**
 * GET all bedrooms for the logged-in user
 */
router.get('/', async (req, res) => {
  try {
    // Find all bedrooms owned by the current user
    const bedrooms = await Bedroom.find({ ownerId: req.user.id });

    // If no bedrooms found, return 404
    if (!bedrooms || bedrooms.length === 0) {
      return res.status(404).json({ message: 'No bedrooms found for this user.' });
    }

    // Return the list of bedrooms
    res.json(bedrooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET a specific bedroom by name (only if it belongs to logged-in user)
 */
router.get('/by-name/:bedroomName', async (req, res) => {
  try {
    // Find bedroom by owner and name
    const bedroom = await Bedroom.findOne({
      ownerId: req.user.id,
      bedroomName: req.params.bedroomName
    });

    // If not found, return 404
    if (!bedroom) {
      return res.status(404).json({ message: 'Bedroom not found.' });
    }

    // Return the bedroom
    res.json(bedroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET a specific bedroom by ID (only if it belongs to logged-in user)
 */
router.get('/:id', async (req, res) => {
  try {
    // Find bedroom by ID
    const bedroom = await Bedroom.findById(req.params.id);

    // Check if bedroom exists and belongs to user
    if (!bedroom || bedroom.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Bedroom not found.' });
    }

    // Return the bedroom
    res.json(bedroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST create a new bedroom for logged-in user
 */
router.post('/new', async (req, res) => {
  try {
    // Validate lightLevel if provided
    if (req.body.lightLevel) {
      const isValidLight = validLightLevels.includes(req.body.lightLevel);
      if (!isValidLight) {
        return res.status(400).json({ message: `Light level must be one of: ${validLightLevels.join(', ')}` });
      }
    }

    // Validate noiseLevel if provided
    if (req.body.noiseLevel) {
      const isValidNoise = validNoiseLevels.includes(req.body.noiseLevel);
      if (!isValidNoise) {
        return res.status(400).json({ message: `Noise level must be one of: ${validNoiseLevels.join(', ')}` });
      }
    }

    // Validate temperature if provided
    if (req.body.temperature) {
      const temp = req.body.temperature;
      if (temp < 50 || temp > 100) {
        return res.status(400).json({ message: 'Temperature must be between 50 and 100 degrees Fahrenheit.' });
      }
    }

    // Create new Bedroom document
    const newBedroom = new Bedroom({
      ownerId: req.user.id,
      ...req.body
    });

    // Save to database
    const savedBedroom = await newBedroom.save();

    // Return the created bedroom
    res.status(201).json(savedBedroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT update a specific bedroom by ID (only if it belongs to logged-in user)
 */
router.put('/:id', async (req, res) => {
  try {
    // Validate lightLevel if provided
    if (req.body.lightLevel) {
      const isValidLight = validLightLevels.includes(req.body.lightLevel);
      if (!isValidLight) {
        return res.status(400).json({ message: `Light level must be one of: ${validLightLevels.join(', ')}` });
      }
    }

    // Validate noiseLevel if provided
    if (req.body.noiseLevel) {
      const isValidNoise = validNoiseLevels.includes(req.body.noiseLevel);
      if (!isValidNoise) {
        return res.status(400).json({ message: `Noise level must be one of: ${validNoiseLevels.join(', ')}` });
      }
    }

    // Validate temperature if provided
    if (req.body.temperature) {
      const temp = req.body.temperature;
      if (temp < 50 || temp > 100) {
        return res.status(400).json({ message: 'Temperature must be between 50 and 100 degrees Fahrenheit.' });
      }
    }

    // Find the bedroom by ID
    const bedroom = await Bedroom.findById(req.params.id);

    // Check if bedroom exists and belongs to user
    if (!bedroom || bedroom.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Bedroom not found.' });
    }

    // Update the bedroom fields
    Object.assign(bedroom, req.body);
    bedroom.lastUpdatedAt = new Date();

    // Save the updated bedroom
    const updatedBedroom = await bedroom.save();

    // Return the updated bedroom
    res.json(updatedBedroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE a specific bedroom by ID (only if it belongs to logged-in user)
 * Prevent deleting the last bedroom for the user and require password confirmation
 */
router.delete('/:id', async (req, res) => {
  try {
    const { password } = req.body;

    // Require password for deletion
    if (!password) {
      return res.status(400).json({ message: 'Password required for deletion.' });
    }

    // Find the user
    const user = await User.findById(req.user.id);

    // Check password
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // Count user's bedrooms
    const bedroomCount = await Bedroom.countDocuments({ ownerId: req.user.id });
    if (bedroomCount <= 1) {
      return res.status(400).json({ message: 'You cannot delete your last bedroom.' });
    }

    // Find the bedroom to delete
    const bedroom = await Bedroom.findById(req.params.id);

    // Check if bedroom exists and belongs to user
    if (!bedroom || bedroom.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Bedroom not found.' });
    }

    // Delete the bedroom
    await bedroom.deleteOne();

    // Return success message
    res.json({ message: 'Bedroom deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
