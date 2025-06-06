const express = require('express');
const router = express.Router();
// Import the User model to interact with the users collection
const User = require('../models/user');
// Import Bedroom model to interact with the bedrooms collection
const Bedroom = require('../models/bedroom');
// Import the verifyToken middleware to protect routes
const verifyToken = require('../middleware/verify-token');

//no access to bedrooms without a valid token (user must be signed in)
router.use(verifyToken);

//route to get all bedrooms for a user
router.get('/', async (req, res) => {
    try {
        const bedrooms = await Bedroom.find({ userId: req.user.id });
        if (!bedrooms || bedrooms.length === 0) {
            return res.status(404).json({ message: 'No bedrooms found for this user.' });
        }
        res.json(bedrooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
//fetch a form to create a new bedroom
router.get('/new', (req, res) => {
    res.json({ bedroomForm: "Please provide bedroom details to create a new bedroom." });
});
//create a new bedroom with information from the request body
router.post('/new', async (req, res) => {
    try {
        const newBedroom = new Bedroom({
            ownerId: req.user.id, // associate with the logged-in user
            ...req.body // spread the rest of the bedroom data from the request body
        });

        const savedBedroom = await newBedroom.save();
        res.status(201).json(savedBedroom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
//route to get a specific bedroom by ID
router.get('/:id', async (req, res) => {
    try {
        console.log(req)
        const bedroom = await Bedroom.findById(req.params.id);
        if (!bedroom || !req.user) {
            return res.status(404).json({ message: 'Bedroom not found.' });
        }
        // If the bedroom is found and belongs to the user, return it
        res.json(bedroom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
//route to update a specific bedroom by ID
router.put('/:id', async (req, res) => {
    try {
        //validate that values of update form fit Bedroom model
        if(req.body.temperature < 50 || req.body.temperature > 100) {
            return res.status(400).json({ message: 'Temperature must be between 50 and 100 degrees Fahrenheit.' });
        }
        if(req.body.lightLevel < 0 || req.body.lightLevel > 5) {
            return res.status(400).json({ message: 'Light level must be between 0 and 5.' });
        }
        if(req.body.noiseLevel < 0 || req.body.noiseLevel > 5) {
            return res.status(400).json({ message: 'Noise level must be between 0 and 5.' });
        }

        const updatedBedroom = await Bedroom.findByIdAndUpdate(
            req.params.id,
            { ...req.body }, // spread the updated bedroom data from the request body
            { new: true } // return the updated document
        );

        if (!updatedBedroom) {
            return res.status(404).json({ message: 'Bedroom not found.' });
        }
        res.json(updatedBedroom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
//route to delete a specific bedroom by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedBedroom = await Bedroom.findByIdAndDelete(req.params.id);
        if (!deletedBedroom) {
            return res.status(404).json({ message: 'Bedroom not found.' });
        }
        res.json({ message: 'Bedroom deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
