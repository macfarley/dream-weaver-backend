const express = require('express');
const router = express.Router();
const Bedroom = require('../models/Bedroom');
const verifyToken = require('../middleware/verifyToken');

// Require authentication for all bedroom routes
router.use(verifyToken);

// Allowed enum values (must match Bedroom schema)
const validLightLevels = ['pitch black', 'very dim', 'dim', 'normal', 'bright', 'daylight'];
const validNoiseLevels = ['silent', 'very quiet', 'quiet', 'moderate', 'loud', 'very loud'];

// GET all bedrooms for the logged-in user
router.get('/', async (req, res) => {
  try {
    const bedrooms = await Bedroom.find({ ownerId: req.user.id });
    if (!bedrooms || bedrooms.length === 0) {
      return res.status(404).json({ message: 'No bedrooms found for this user.' });
    }
    res.json(bedrooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create a new bedroom for logged-in user
router.post('/new', async (req, res) => {
  try {
    // Validate semantic fields
    if (req.body.lightLevel && !validLightLevels.includes(req.body.lightLevel)) {
      return res.status(400).json({ message: `Light level must be one of: ${validLightLevels.join(', ')}` });
    }
    if (req.body.noiseLevel && !validNoiseLevels.includes(req.body.noiseLevel)) {
      return res.status(400).json({ message: `Noise level must be one of: ${validNoiseLevels.join(', ')}` });
    }
    if (req.body.temperature && (req.body.temperature < 50 || req.body.temperature > 100)) {
      return res.status(400).json({ message: 'Temperature must be between 50 and 100 degrees Fahrenheit.' });
    }

    const newBedroom = new Bedroom({
      ownerId: req.user.id,
      ...req.body
    });

    const savedBedroom = await newBedroom.save();
    res.status(201).json(savedBedroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a specific bedroom by ID (only if it belongs to logged-in user)
router.get('/:id', async (req, res) => {
  try {
    const bedroom = await Bedroom.findById(req.params.id);
    if (!bedroom || bedroom.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Bedroom not found.' });
    }
    res.json(bedroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update a specific bedroom by ID (only if it belongs to logged-in user)
router.put('/:id', async (req, res) => {
  try {
    // Validate semantic fields
    if (req.body.lightLevel && !validLightLevels.includes(req.body.lightLevel)) {
      return res.status(400).json({ message: `Light level must be one of: ${validLightLevels.join(', ')}` });
    }
    if (req.body.noiseLevel && !validNoiseLevels.includes(req.body.noiseLevel)) {
      return res.status(400).json({ message: `Noise level must be one of: ${validNoiseLevels.join(', ')}` });
    }
    if (req.body.temperature && (req.body.temperature < 50 || req.body.temperature > 100)) {
      return res.status(400).json({ message: 'Temperature must be between 50 and 100 degrees Fahrenheit.' });
    }

    const bedroom = await Bedroom.findById(req.params.id);
    if (!bedroom || bedroom.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Bedroom not found.' });
    }

    Object.assign(bedroom, req.body);
    const updatedBedroom = await bedroom.save();

    res.json(updatedBedroom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a specific bedroom by ID (only if it belongs to logged-in user)
// Prevent deleting the last bedroom for the user
router.delete('/:id', async (req, res) => {
    try {
        // Count bedrooms for this user
        const bedroomCount = await Bedroom.countDocuments({ ownerId: req.user.id });
        if (bedroomCount <= 1) {
            return res.status(400).json({ message: 'You cannot delete your last bedroom.' });
        }

        const bedroom = await Bedroom.findById(req.params.id);
        if (!bedroom || bedroom.ownerId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Bedroom not found.' });
        }
        await bedroom.deleteOne();
        res.json({ message: 'Bedroom deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
