const express = require('express');
const router = express.Router();
// Import the User model to interact with the users collection
const User = require('../models/user');
// Import Bedroom model to interact with the bedrooms collection
const Bedroom = require('../models/bedroom');
// Import the verifyToken middleware to protect routes
const verifyToken = require('../middleware/verify-token');
const GoToBed = require('../models/goToBed');

//can only interact with sleep data if logged in
router.use(verifyToken);

//all routes related to go to bed data
// GET retrieves all sleep data for the logged-in user
router.get('/', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token

    // Find all goToBed entries for the user
    GoToBed.find({ user: userId })
        .populate('bedroom', 'name') // Populate bedroom details
        .sort({ createdAt: -1 }) // Sort by most recent first
        .then(entries => {
            res.status(200).json(entries);
        })
        .catch(err => {
            console.error('Error retrieving goToBed entries:', err);
            res.status(500).json({ error: 'Failed to retrieve goToBed entries' });
        });
});
// POST creates a new date's sleep data
router.post('/new', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token
    const goToBedData = req.body;

    // Create the new entry
    // Combine the user ID with the incoming goToBed data
    const newGoToBedEntry = {
        user: userId,
        ...goToBedData
    };

    // Create the new GoToBed entry in the database
    GoToBed.create(newGoToBedEntry)
        .then(newEntry => {
            // Successfully created the entry, send it back to the client
            res.status(201).json(newEntry);
        })
        .catch(err => {
            // Log the error for debugging
            console.error('Error creating goToBed entry:', err);

            // Send an error response to the client
            res.status(400).json({
                error: 'Failed to create goToBed entry',
                details: err.message
            });
        });
});
// GET a single date sleep data
router.get('/:id', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token
    const entryId = req.params.id; // Get the entry ID from the request parameters

    // Find the specific goToBed entry for the user
    GoToBed.findOne({ _id: entryId, user: userId })
        .populate('bedroom', 'name') // Populate bedroom details
        .then(entry => {
            if (!entry) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            res.status(200).json(entry);
        })
        .catch(err => {
            console.error('Error retrieving goToBed entry:', err);
            res.status(500).json({ error: 'Failed to retrieve goToBed entry' });
        });
}
);
// add a wakeup to an existing goToBed entry
router.post('/:id/wakeUp', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token
    const entryId = req.params.id; // Get the entry ID from the request parameters
    const wakeUpData = req.body;

    // Find the specific goToBed entry for the user
    GoToBed.findOneAndUpdate(
        { _id: entryId, user: userId },
        { $push: { wakeUps: wakeUpData } }, // Add the new wakeup to the array
        { new: true } // Return the updated document
    )
        .then(updatedEntry => {
            if (!updatedEntry) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            res.status(200).json(updatedEntry);
        })
        .catch(err => {
            console.error('Error adding wakeup to goToBed entry:', err);
            res.status(500).json({ error: 'Failed to add wakeup to goToBed entry' });
        });
});
//GET the form to edit or delete a goToBed entry
router.get('/:id/edit', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token
    const entryId = req.params.id; // Get the entry ID from the request parameters

    // Find the specific goToBed entry for the user
    GoToBed.findOne({ _id: entryId, user: userId })
        .then(entry => {
            if (!entry) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            res.status(200).json({ entry, message: "Edit form retrieved successfully" });
        })
        .catch(err => {
            console.error('Error retrieving goToBed entry:', err);
            res.status(500).json({ error: 'Failed to retrieve goToBed entry' });
        });
});
// PUT to save changes to an existing goToBed entry
router.put('/:id/edit', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token
    const entryId = req.params.id; // Get the entry ID from the request parameters
    const updatedData = req.body;

    // Find the specific goToBed entry for the user and update it
    GoToBed.findOneAndUpdate(
        { _id: entryId, user: userId },
        { $set: updatedData },
        { new: true }
    )
    .then(updatedEntry => {
        if (!updatedEntry) {
            res.status(404).json({ error: 'Entry not found' });
            return;
        }
        res.status(200).json(updatedEntry);
    })
    .catch(err => {
        console.error('Error updating goToBed entry:', err);
        res.status(500).json({ error: 'Failed to update goToBed entry' });
    });
});
// DELETE to remove an existing goToBed entry
// TODO: require password for delete
router.delete('/:id/delete', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token
    const entryId = req.params.id; // Get the entry ID from the request parameters
    
    // Find the specific goToBed entry for the user and delete it
    GoToBed.findOneAndDelete({ _id: entryId, user: userId })
        .then(deletedEntry => {
            if (!deletedEntry) {
                return res.status(404).json({ error: 'Entry not found' });
            }
            res.status(200).json({ message: 'Entry deleted successfully', deletedEntry });
        })
        .catch(err => {
            console.error('Error deleting goToBed entry:', err);
            res.status(500).json({ error: 'Failed to delete goToBed entry' });
        });
}
);
   
module.exports = router;