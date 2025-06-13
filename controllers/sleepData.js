const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const SleepData = require('../models/SleepData');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

/**
 * Middleware to check if the SleepData belongs to the current user.
 * Looks up the SleepData by id or date, and compares the user field.
 */
async function checkOwnership(req, res, next) {
  try {
    // Try to find the SleepData by id (for PUT/DELETE) or by date (for GET)
    const sleepDataId = req.params.id || req.params.date;
    const sleepData = await SleepData.findById(sleepDataId);

    // If not found, return 404
    if (!sleepData) {
      return res.status(404).json({ error: 'Sleep session not found.' });
    }

    // Check if the sleepData belongs to the current user
    if (sleepData.user.toString() !== req.user._id) {
      return res.status(403).json({ error: 'Unauthorized access to this sleep session.' });
    }

    // Attach the sleepData to the request for downstream handlers
    req.sleepData = sleepData;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * GET / - Get all sleep sessions for the current user.
 * Returns an array of SleepData, sorted by creation date (most recent first).
 */
router.get('/', async (req, res, next) => {
  try {
    // Find all SleepData documents for the current user
    const sleepData = await SleepData.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(sleepData);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /:date - Get a sleep session by date (expects date in YYYYMMDD format).
 * Returns the SleepData for that date, if it exists and belongs to the user.
 */
router.get('/:date', async (req, res, next) => {
  try {
    const dateStr = req.params.date;

    // Validate date format (YYYYMMDD)
    if (!/^\d{8}$/.test(dateStr)) {
      return res.status(400).json({ error: 'Invalid date format, expected YYYYMMDD' });
    }

    // Parse the date string into year, month, and day
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1; // JS months are 0-based
    const day = parseInt(dateStr.slice(6, 8), 10);

    // Create a date range for the entire day (midnight to midnight UTC)
    const start = new Date(Date.UTC(year, month, day));
    const end = new Date(Date.UTC(year, month, day + 1));

    // Find a SleepData document for the user where createdAt is within the date range
    const sleepData = await SleepData.findOne({
      user: req.user._id,
      createdAt: { $gte: start, $lt: end },
    });

    if (!sleepData) {
      return res.status(404).json({ error: 'Sleep session not found for that date.' });
    }

    res.json(sleepData);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /:id - Update a sleep session by id.
 * Only allows certain fields to be updated (whitelisted).
 * Uses checkOwnership middleware to ensure user owns the session.
 */
router.put('/:id', checkOwnership, async (req, res, next) => {
  try {
    const updates = req.body;

    // Only allow certain fields to be updated
    const allowedUpdates = ['bedroom', 'sleepyThoughts', 'wakeUps', 'cuddleBuddy', 'createdAt'];

    // Remove any fields from updates that are not allowed
    Object.keys(updates).forEach((key) => {
      if (!allowedUpdates.includes(key)) {
        delete updates[key];
      }
    });

    // Apply the updates to the sleepData document
    Object.assign(req.sleepData, updates);

    // Save the updated document
    await req.sleepData.save();

    res.json(req.sleepData);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /:id - Delete a sleep session by id.
 * Requires password verification for extra security.
 * Uses checkOwnership middleware to ensure user owns the session.
 */
router.delete('/:id', checkOwnership, async (req, res, next) => {
  try {
    const { password } = req.body;

    // Require password in request body
    if (!password) {
      return res.status(400).json({ error: 'Password required to delete sleep session.' });
    }

    // Fetch the user to verify password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // Remove the sleepData document
    await req.sleepData.remove();

    res.json({ message: 'Sleep session deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
