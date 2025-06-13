const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Models
const User = require('../models/User');
const Bedroom = require('../models/Bedroom');

// Config
const saltRounds = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '24h';

/**
 * Helper function to check required fields for signup
 */
function validateSignupFields(body) {
  const { username, email, password } = body;
  if (!username || !email || !password) {
    return false;
  }
  return true;
}

/**
 * Helper function to check required fields for login
 */
function validateLoginFields(body) {
  const { username, password } = body;
  if (!username || !password) {
    return false;
  }
  return true;
}

/**
 * POST /auth/signup
 * Handles user registration
 */
router.post('/signup', async (req, res) => {
  try {
    // Extract fields from request body
    const {
      username,
      firstName,
      lastName,
      dateOfBirth,
      email,
      password,
      userPreferences,
      role,
      joinedAt
    } = req.body;

    // Validate required fields
    if (!validateSignupFields(req.body)) {
      return res.status(400).json({ err: 'Username, email, and password are required.' });
    }

    // Check if user already exists (by username or email)
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      return res.status(409).json({ err: 'Username or email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user document
    const newUser = new User({
      username,
      firstName,
      lastName,
      dateOfBirth,
      email,
      hashedPassword,
      userPreferences,
      role,
      joinedAt: joinedAt || new Date()
    });

    // Save user to database
    await newUser.save();

    // Create a default bedroom for the new user
    const defaultBedroom = new Bedroom({
      ownerId: newUser._id,
      bedroomName: 'Hotel',
    });
    await defaultBedroom.save();

    // Prepare JWT payload
    const payload = {
      _id: newUser._id,
      username: newUser.username,
      role: newUser.role
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Respond with token
    res.status(201).json({ token });
  } catch (error) {
    // Log error and respond with server error
    console.error(error);
    res.status(500).json({ err: 'Server error during sign-up.' });
  }
});

/**
 * POST /auth/login
 * Handles user login
 */
router.post('/login', async (req, res) => {
  try {
    // Extract fields from request body
    const { username, password } = req.body;

    // Validate required fields
    if (!validateLoginFields(req.body)) {
      return res.status(400).json({ err: 'Username and password are required.' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ err: 'User not found.' });
    }

    // Compare provided password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    // Prepare JWT payload
    const payload = {
      _id: user._id,
      username: user.username,
      role: user.role
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Respond with token
    res.status(200).json({ token });
  } catch (error) {
    // Log error and respond with server error
    console.error(error);
    res.status(500).json({ err: 'Server error during login.' });
  }
});

module.exports = router;
