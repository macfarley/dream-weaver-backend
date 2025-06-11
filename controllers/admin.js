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

        // Only allow if user is admin or updating their own data
        const isAdmin = req.user.role === 'admin';
        const isSelf = req.user.id === userId;
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        // Prevent changing username or role
        if ('username' in req.body || 'role' in req.body) {
            return res.status(400).json({ error: 'Username and role cannot be changed.' });
        }

        // Prepare update data
        const { email, password, firstName, lastName, dateOfBirth } = req.body;
        const updateData = {};

        // Update fields if provided
        if (email) updateData.email = email.toLowerCase();
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
        if (userPreferences) updateData.userPreferences = userPreferences;

        // If password is provided, hash it before saving
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.hashedPassword = await bcrypt.hash(password, salt);
        }

        // Update user and exclude hashedPassword from response
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-hashedPassword');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        // Handle errors during update
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

        // Delete user by ID
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        // Handle errors during deletion
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

module.exports = router;
