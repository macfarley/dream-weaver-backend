const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

/**
 * GET /users
 * Get all users (admin only)
 */
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        // Fetch all users, excluding the hashedPassword field
        const users = await User.find({}, '-hashedPassword');
        res.status(200).json(users);
    } catch (err) {
        // Handle errors during fetching
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

/**
 * GET /users/:id
 * Get a user by ID (admin or self)
 */
router.get('/users/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;

        // Only allow if user is admin or accessing their own data
        const isAdmin = req.user.role === 'admin';
        const isSelf = req.user.id === userId;
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        // Find user by ID, exclude hashedPassword
        const user = await User.findById(userId, '-hashedPassword');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json(user);
    } catch (err) {
        // Handle errors during fetching
        res.status(500).json({ error: 'Failed to fetch user.' });
    }
});

/**
 * PUT /users/:id
 * Update a user (admin or self)
 */
router.put('/users/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;

    const isAdmin = req.user.role === 'admin';
    const isSelf = String(req.user.id) === String(userId);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { email, password, firstName, lastName, dateOfBirth, userPreferences } = req.body;
    const updateData = {};

    // Validate and assign allowed fields
    if (email) {
    if (typeof email !== 'string' || !email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && String(existingUser._id) !== String(userId)) {
        return res.status(400).json({ error: 'Email is already in use by another account.' });
    }
    updateData.email = email.toLowerCase();
    }


    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth.' });
      }
      updateData.dateOfBirth = dob;
    }

    if (userPreferences) {
      if (typeof userPreferences !== 'object') {
        return res.status(400).json({ error: 'Invalid user preferences.' });
      }
      updateData.userPreferences = userPreferences;
    }

    if (password) {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.hashedPassword = await bcrypt.hash(password, salt);
    }

    // Prevent role or username changes
    if ('role' in req.body || 'username' in req.body) {
      return res.status(400).json({ error: 'Username and role cannot be changed.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-hashedPassword');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

/**
 * DELETE /users/:id
 * Delete a user (admin only)
 */
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminPassword = req.headers['x-admin-password'];

    if (!adminPassword) {
      return res.status(400).json({ error: 'Admin password required for deletion.' });
    }

    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(403).json({ error: 'Admin authentication failed.' });
    }

    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.hashedPassword);
    if (!passwordMatch) {
      return res.status(403).json({ error: 'Incorrect admin password.' });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
