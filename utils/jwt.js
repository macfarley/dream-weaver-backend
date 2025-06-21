// utils/jwt.js
// Centralized JWT creation and verification logic for DreamWeaver backend

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '24h';

/**
 * Generates a JWT token for a user.
 * @param {Object} payload - The payload to encode in the JWT (typically user info)
 * @param {string} [expiresIn] - Optional expiration override (default: 24h)
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = TOKEN_EXPIRY) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws if invalid or expired.
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = {
    generateToken,
    verifyToken,
    TOKEN_EXPIRY
};
