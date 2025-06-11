const express = require('express');
const router = express.Router();
// Import the User model to interact with the users collection
const User = require('../models/User');
// Import Bedroom model to interact with the bedrooms collection
const Bedroom = require('../models/Bedroom');
// Import the verifyToken middleware to protect routes
const verifyToken = require('../middleware/verifyToken');
const SleepData = require('../models/SleepData');

//can only interact with sleep data if logged in
router.use(verifyToken);

//all routes related to go to bed data
// GET retrieves all sleep data for the
//  logged-in user
router.get('/', (req, res) => {
    const userId = req.user._id; // Get the user ID from the verified token

    // Find all SleepData entries for the user
    SleepData.find({ user: userId })
        .populate('bedroom', 'name') // Populate bedroom details
        .sort({ createdAt: -1 }) // Sort by most recent first
        .then(entries => {
            res.status(200).json(entries);
        })
        .catch(err => {
            console.error('Error retrieving SleepData entries:', err);
            res.status(500).json({ error: 'Failed to retrieve SleepData entries' });
        });
});
module.exports = router;
