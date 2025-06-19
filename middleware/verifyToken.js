/**
 * ============================================================================
 * JWT TOKEN VERIFICATION MIDDLEWARE
 * ============================================================================
 * 
 * This middleware validates JSON Web Tokens (JWT) from incoming requests.
 * It ensures that only authenticated users can access protected routes.
 * 
 * The middleware:
 * 1. Extracts the JWT token from the Authorization header
 * 2. Verifies the token's signature and expiration
 * 3. Decodes the user information from the token payload
 * 4. Attaches user data to the request object for downstream handlers
 * 
 * Usage: Apply this middleware to any route that requires authentication
 * Example: app.use('/protected-route', verifyToken, routeHandler);
 * 
 * Token Format Expected: "Bearer <jwt_token>"
 * ============================================================================
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware function to verify JWT tokens
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next middleware function
 * 
 * @description
 * Validates JWT tokens from the Authorization header. If valid, the decoded
 * user information is attached to req.user for use in subsequent middleware
 * and route handlers.
 * 
 * Expected token payload structure:
 * {
 *   _id: "user_object_id",
 *   username: "user_username", 
 *   role: "user" | "admin",
 *   iat: timestamp,
 *   exp: timestamp
 * }
 */
function verifyToken(req, res, next) {
  try {
    // Extract the Authorization header from the incoming request
    // Expected format: "Bearer <jwt_token>"
    const authHeader = req.headers.authorization;

    // Validate that the Authorization header exists
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied. No authorization header provided.',
        message: 'Please include an Authorization header with your JWT token',
        requiredFormat: 'Authorization: Bearer <your_jwt_token>'
      });
    }

    // Validate that the Authorization header uses the Bearer scheme
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid authorization format.',
        message: 'Authorization header must use Bearer token format',
        requiredFormat: 'Authorization: Bearer <your_jwt_token>',
        receivedFormat: authHeader.substring(0, 20) + '...' // Show first 20 chars for debugging
      });
    }

    // Extract the actual token from the header
    // Split by space and take the second part (after "Bearer ")
    const token = authHeader.split(' ')[1];

    // Validate that a token was actually provided after "Bearer "
    if (!token || token.trim() === '') {
      return res.status(401).json({ 
        error: 'No token provided after Bearer.',
        message: 'The Authorization header contains "Bearer " but no token follows it'
      });
    }

    // Verify that JWT_SECRET is available in environment
    if (!process.env.JWT_SECRET) {
      console.error('🚨 CRITICAL ERROR: JWT_SECRET environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error.',
        message: 'Authentication system is not properly configured'
      });
    }

    // Verify the token using the secret key from environment variables
    // This will throw an error if the token is invalid, expired, or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate that the decoded token contains required user information
    if (!decoded._id || !decoded.username) {
      return res.status(401).json({ 
        error: 'Invalid token payload.',
        message: 'Token does not contain required user information'
      });
    }

    // Log successful authentication for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 User authenticated: ${decoded.username} (${decoded.role || 'user'})`);
    }

    // Attach the decoded user information to the request object
    // This makes user data available to all subsequent middleware and route handlers
    req.user = {
      _id: decoded._id,           // User's database ID
      id: decoded._id,            // Alias for compatibility
      username: decoded.username, // User's username
      role: decoded.role || 'user' // User's role (defaults to 'user' if not specified)
    };

    // Call the next middleware function or route handler
    next();

  } catch (error) {
    // Handle different types of JWT errors with specific messages
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired.',
        message: 'Your session has expired. Please log in again.',
        expiredAt: error.expiredAt
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        message: 'The provided token is malformed or invalid',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        error: 'Token not yet valid.',
        message: 'The token is not active yet',
        activeAt: error.date
      });
    } else {
      // Log unexpected errors for debugging
      console.error('🚨 Unexpected error in verifyToken middleware:', error);
      return res.status(500).json({ 
        error: 'Authentication system error.',
        message: 'An unexpected error occurred during token verification'
      });
    }
  }
}

module.exports = verifyToken;
