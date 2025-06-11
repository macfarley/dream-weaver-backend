function requireAdmin(req, res, next) {
  // Ensure req.user exists and has a role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = requireAdmin;
