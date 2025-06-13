require('dotenv').config();
// Load environment variables from .env file

// ====================
// Import Dependencies
// ====================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');
const helmet = require('helmet');

// ====================
// Import Route Controllers
// ====================
const authRouter = require('./controllers/auth');
const adminRouter = require('./controllers/admin');
const userRouter = require('./controllers/users');
const bedroomRouter = require('./controllers/bedrooms');
const gotobedRouter = require('./controllers/goToBed');

// ====================
// Import Middleware
// ====================
const verifyToken = require('./middleware/verifyToken');
const requireAdmin = require('./middleware/requireAdmin');

// ====================
// Initialize Express App
// ====================
const app = express();

// ====================
// Database Connection
// ====================

// Get MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI;

// Connect to MongoDB with options for compatibility
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Log successful connection
mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}.`);
});

// Log connection errors
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// ====================
// Middleware Setup
// ====================

// Set security-related HTTP headers
app.use(helmet());

// Enable CORS for all routes
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded data (for form submissions, etc.)
app.use(express.urlencoded({ extended: true }));

// Log HTTP requests to the console
app.use(logger('dev'));

// ====================
// Route Definitions
// ====================

// -------- Public Routes (No Authentication Required) --------

// Authentication routes (login, register, etc.)
app.use('/auth', authRouter);

// -------- Protected Routes (Require Login) --------

// User routes (profile, settings, etc.)
app.use('/users', verifyToken, userRouter);

// Bedroom routes (user-specific data)
app.use('/bedrooms', verifyToken, bedroomRouter);

// GoToBed routes (user-specific actions)
app.use('/gotobed', verifyToken, gotobedRouter);

// -------- Admin Routes (Require Login + Admin Role) --------

// Admin-only routes (user management, etc.)
app.use('/admin', verifyToken, requireAdmin, adminRouter);

// ====================
// Error Handling Middleware
// ====================

// Catch-all error handler
app.use((err, req, res, next) => {
  // Log error stack trace for debugging
  console.error(err.stack);

  // Send error response to client
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ====================
// Start Server
// ====================

// Get port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Start listening for incoming requests
app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}`);
});
