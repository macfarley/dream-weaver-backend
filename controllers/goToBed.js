// Import required modules
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const SleepData = require('../models/SleepData');

// Middleware: Protect all routes with token verification
router.use(verifyToken);

/**
 * @route   POST /gotobed/new
 * @desc    Create a new sleep entry for the authenticated user
 * @access  Protected
 */
router.post('/new', async (req, res) => {
    try {
        // Create a new SleepData document, associating it with the current user
        const sleepData = new SleepData({
            user: req.user._id,
            ...req.body
        });
        // Save the new entry to the database
        const newEntry = await sleepData.save();
        res.status(201).json(newEntry);
    } catch (err) {
        console.error('Error creating SleepData entry:', err);
        res.status(400).json({ error: 'Failed to create SleepData entry', details: err.message });
    }
});

/**
 * @route   GET /gotobed/:id
 * @desc    Retrieve a single sleep entry by ID for the authenticated user
 * @access  Protected
 */
router.get('/:id', async (req, res) => {
    try {
        // Find the entry by ID and user, and populate the 'bedroom' field with its name
        const entry = await SleepData.findOne({ _id: req.params.id, user: req.user._id })
            .populate('bedroom', 'bedroomName');
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(entry);
    } catch (err) {
        console.error('Error retrieving SleepData entry:', err);
        res.status(500).json({ error: 'Failed to retrieve SleepData entry' });
    }
});

/**
 * @route   POST /gotobed/:id/wakeup
 * @desc    Add a wakeUp entry to a specific sleep entry
 * @access  Protected
 */
router.post('/:id/wakeup', async (req, res) => {
    try {
        // Push a new wakeUp object into the wakeUps array of the specified entry
        const updated = await SleepData.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $push: { wakeUps: req.body } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(updated);
    } catch (err) {
        console.error('Error adding wakeUp:', err);
        res.status(500).json({ error: 'Failed to add wakeUp' });
    }
});

/**
 * @route   PATCH /gotobed/:id/wakeup/:index/backtobed
 * @desc    Add or update the backToBedAt time for a specific wakeUp entry
 * @access  Protected
 */
router.patch('/:id/wakeup/:index/backtobed', async (req, res) => {
    try {
        const { backToBedAt } = req.body;
        // Find the sleep entry for the user
        const sleepEntry = await SleepData.findOne({ _id: req.params.id, user: req.user._id });
        if (!sleepEntry) return res.status(404).json({ error: 'Entry not found' });

        // Validate the wakeUp index
        const wakeIndex = parseInt(req.params.index);
        if (isNaN(wakeIndex) || wakeIndex < 0 || wakeIndex >= sleepEntry.wakeUps.length) {
            return res.status(400).json({ error: 'Invalid wakeUp index' });
        }

        // Update the backToBedAt field for the specified wakeUp
        sleepEntry.wakeUps[wakeIndex].backToBedAt = backToBedAt;
        await sleepEntry.save();
        res.status(200).json(sleepEntry);
    } catch (err) {
        console.error('Error adding backToBedAt:', err);
        res.status(500).json({ error: 'Failed to update wakeUp entry' });
    }
});

/**
 * @route   PUT /gotobed/:id/edit
 * @desc    Update an entire sleep entry
 * @access  Protected
 */
router.put('/:id/edit', async (req, res) => {
    try {
        // Update the entry with the provided data
        const updated = await SleepData.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: req.body },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json(updated);
    } catch (err) {
        console.error('Error updating SleepData:', err);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

/**
 * @route   DELETE /gotobed/:id/delete
 * @desc    Delete a sleep entry
 * @access  Protected
 */
router.delete('/:id/delete', async (req, res) => {
    try {
        // Delete the entry for the user
        const deleted = await SleepData.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deleted) return res.status(404).json({ error: 'Entry not found' });
        res.status(200).json({ message: 'Entry deleted successfully', deleted });
    } catch (err) {
        console.error('Error deleting SleepData:', err);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Export the router to be used in the main app
module.exports = router;
