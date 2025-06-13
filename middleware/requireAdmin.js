// Middleware to ensure the user has admin privileges
function requireAdmin(req, res, next) {
  // Check if the user object exists on the request
  const user = req.user;

  // If there is no user, deny access
  if (!user) {
    return res.status(403).json({ error: 'User not authenticated. Admin access required.' });
  }

  // Check if the user's role is 'admin'
  const isAdmin = user.role === 'admin';

  // If the user is not an admin, deny access
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  // User is authenticated and is an admin, proceed to the next middleware
  next();
}

module.exports = requireAdmin;
