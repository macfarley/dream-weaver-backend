const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Import User model
const User = require('../models/user'); // Adjust the path as necessary
// Import the verifyToken middleware to protect routes
const verifyToken = require('../middleware/verify-token');

// Salt rounds for bcrypt
const saltRounds = 12;
const signUpExample = {
  "username": "funkybuttlovin",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2000-01-01",
  "email": "funky@example.com",
  "password": "password123"
}

//sign up route
router.post('/sign-up', async (req, res) => {
  try {
// Check if the user already exists
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(409).json({ err: 'User already exists.' });
    }
// Hash the password
    const hashedPassword = bcrypt.hashSync(req.body.password, saltRounds);
// Create a new user
    const newUser = await User.create({ ...req.body, hashedPassword });
// Construct the payload
    const payload = { username: newUser.username, _id: newUser._id };
// Create the token, attaching the payload
    const token = jwt.sign({ payload }, process.env.JWT_SECRET);
// Send back the token
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

//sign in route
router.post('/sign-in', async (req, res) => {
  try {
// Check if the request body has the required fields
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ err: 'Username and password are required.' });
    }
// Find the user by username
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }
//compare the password
    const isPasswordCorrect = bcrypt.compareSync(
      req.body.password, user.hashedPassword
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }
// Construct the payload
    const payload = { username: user.username, _id: user._id };

    // Create the token, attaching the payload
    const token = jwt.sign({ payload }, process.env.JWT_SECRET);

    // Send the token instead of the message
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});
//user dashboard route
// This route is protected and requires a valid token to access
router.get('/dashboard', verifyToken, async (req, res) => {
try {
    // Assuming verifyToken middleware sets req.user with the authenticated user's info
    const user = req.user;
    if (user && user.username) {
        res.json({ message: `you're logged in, ${user.username}. here is your dashboard` });
    } else {
        res.redirect('/');
    }
} catch (err) {
    res.status(500).json({ err: err.message });
}
});

module.exports = router;