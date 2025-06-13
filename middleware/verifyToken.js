const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from Authorization header.
 */
function verifyToken(req, res, next) {
  // Get the Authorization header from the request
  const authHeader = req.headers.authorization;

  // Check if the Authorization header exists and is in the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  // Extract the token from the header (format: "Bearer <token>")
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user information to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // If token verification fails, respond with an error
    res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = verifyToken;
