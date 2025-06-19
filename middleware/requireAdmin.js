/**
 * ============================================================================
 * ADMIN ROLE REQUIREMENT MIDDLEWARE
 * ============================================================================
 * 
 * This middleware ensures that only users with administrator privileges
 * can access certain protected routes. It should be used in combination
 * with the verifyToken middleware to provide two-layer security.
 * 
 * Security Flow:
 * 1. verifyToken middleware authenticates the user (confirms valid JWT)
 * 2. requireAdmin middleware authorizes the user (confirms admin role)
 * 3. If both pass, the user can access admin-only routes
 * 
 * Usage: Apply after verifyToken middleware on admin-only routes
 * Example: app.use('/admin', verifyToken, requireAdmin, adminRoutes);
 * 
 * Note: This middleware assumes req.user has been populated by verifyToken
 * ============================================================================
 */

/**
 * Middleware function to require administrator role
 * 
 * @param {Object} req - Express request object (must contain req.user from verifyToken)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @description
 * Validates that the authenticated user has administrator privileges.
 * This middleware MUST be used after verifyToken middleware as it depends
 * on req.user being populated with verified user information.
 * 
 * Expected req.user structure (set by verifyToken):
 * {
 *   _id: "user_object_id",
 *   username: "user_username",
 *   role: "admin" | "user"
 * }
 */
function requireAdmin(req, res, next) {
  try {
    // Ensure this middleware is used after verifyToken
    // req.user should be populated by the verifyToken middleware
    if (!req.user) {
      console.error('🚨 requireAdmin middleware called before verifyToken middleware');
      console.error('   This is a server configuration error - check middleware order');
      return res.status(500).json({ 
        error: 'Server configuration error.',
        message: 'Authentication middleware not properly configured'
      });
    }

    // Extract user information from the request object
    const { username, role, _id } = req.user;

    // Log admin access attempt for security monitoring
    console.log(`🔐 Admin access attempt by user: ${username} (${_id}) with role: ${role || 'undefined'}`);

    // Check if the user's role is specifically 'admin'
    // We use strict equality to prevent any role manipulation
    if (role !== 'admin') {
      // Log unauthorized admin access attempt for security monitoring
      console.warn(`⚠️  Unauthorized admin access attempt by user: ${username} (role: ${role})`);
      
      return res.status(403).json({ 
        error: 'Administrator access required.',
        message: 'This operation requires administrator privileges',
        userRole: role || 'undefined',
        requiredRole: 'admin'
      });
    }

    // Log successful admin access for auditing purposes
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Admin access granted to: ${username}`);
    }

    // User is authenticated AND has admin role - proceed to admin route
    next();

  } catch (error) {
    // Handle any unexpected errors in the middleware
    console.error('🚨 Unexpected error in requireAdmin middleware:', error);
    return res.status(500).json({ 
      error: 'Authorization system error.',
      message: 'An unexpected error occurred while checking admin privileges'
    });
  }
}

module.exports = requireAdmin;
