const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Import models
const User = require('../models/User');
const Bedroom = require('../models/Bedroom');

// Salt rounds for bcrypt hashing
const saltRounds = 12;

//test case User body for Postman
// {
//   "username": "macfarley",
//   "firstName": "Mac",
//   "lastName": "Farley",
//   "dateOfBirth": "1985-05-15",
//   "email": "macfarley@example.com",
//   "password": "adminpassword123",
//   "userPreferences": {},
//   "role": "admin"
// }

//sign up route
router.post('/signup', async (req, res) => {
  try {
    const { username, firstName, lastName, dateOfBirth, email, password, userPreferences, role } = req.body;
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      firstName,
      lastName,
      dateOfBirth,
      email,
      hashedPassword,
      userPreferences,
      role
    });

    await newUser.save();

    // Build JWT payload
    const payload = { 
      id: newUser._id, 
      username: newUser.username, 
      role: newUser.role 
    };

    // Generate JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Every user will need a default bedroom, tied to their user ID
    const defaultBedroom = new Bedroom({
      ownerId: newUser._id,
      bedroomName: 'Hotel',
      // All other fields will use schema defaults
    });

    await defaultBedroom.save();

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
//login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Build JWT payload
    const payload = { 
      id: user._id, 
      username: user.username, 
      role: user.role 
    };

    // Generate JWT token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
