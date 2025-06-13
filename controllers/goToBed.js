const express = require('express');
const router = express.Router();
const SleepData = require('../models/SleepData');
const verifyToken = require('../middleware/verifyToken');

/**
 * Start a new SleepData entry
 * Endpoint: POST /gotobed
 * Requires authentication
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    // Extract relevant fields from request body
    const { bedroom, cuddleBuddy, sleepyThoughts } = req.body;

    // Check if the user already has an active (unfinished) sleep session
    const existing = await SleepData.findOne({
      user: req.user.id,
      // Look for any wakeUp event that is not finished
      'wakeUps.finishedSleeping': { $ne: true },
    });

    if (existing) {
      // If found, prevent starting a new session
      return res.status(400).json({ message: 'You already have an active sleep session.' });
    }

    // Create a new SleepData document
    const newSleep = new SleepData({
      user: req.user.id,
      bedroom,
      cuddleBuddy,
      sleepyThoughts,
      wakeUps: [], // No wakeups yet
      createdAt: new Date(),
    });

    // Save the new sleep session to the database
    const saved = await newSleep.save();

    // Respond with the newly created sleep session
    res.status(201).json(saved);
  } catch (err) {
    // Log and handle any errors
    console.error(err);
    res.status(500).json({ message: 'Server error while starting sleep session.' });
  }
});

/**
 * Add a wakeup event to the active SleepData entry
 * Endpoint: POST /gotobed/wakeup
 * Requires authentication
 */
router.post('/wakeup', verifyToken, async (req, res) => {
  try {
    // Extract wakeup details from request body
    const {
      sleepQuality,
      dreamJournal,
      awakenAt,
      finishedSleeping,
      backToBedAt,
    } = req.body;

    // Find the user's most recent active sleep session (not finished)
    const sleepEntry = await SleepData.findOne({
      user: req.user.id,
      'wakeUps.finishedSleeping': { $ne: true },
    }).sort({ createdAt: -1 });

    if (!sleepEntry) {
      // If no active session, return error
      return res.status(404).json({ message: 'No active sleep session found.' });
    }

    // Build the wakeup event object
    const wakeEvent = {
      sleepQuality,
      dreamJournal,
      // Use provided awakenAt or default to now
      awakenAt: awakenAt ? new Date(awakenAt) : new Date(),
      // Ensure finishedSleeping is a boolean
      finishedSleeping: !!finishedSleeping,
      // Use provided backToBedAt or null
      backToBedAt: backToBedAt ? new Date(backToBedAt) : null,
    };

    // Add the wakeup event to the sleep session
    sleepEntry.wakeUps.push(wakeEvent);

    // Save the updated sleep session
    const updated = await sleepEntry.save();

    // Respond with the updated sleep session
    res.status(200).json(updated);
  } catch (err) {
    // Log and handle any errors
    console.error(err);
    res.status(500).json({ message: 'Server error while updating wakeup.' });
  }
});

module.exports = router;
