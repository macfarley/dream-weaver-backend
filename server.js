/**
 * ============================================================================
 * DREAMWEAVER BACKEND SERVER
 * ============================================================================
 * 
 * Main entry point for the DreamWeaver sleep tracking application backend.
 * This server provides RESTful API endpoints for user authentication, bedroom
 * management, sleep data tracking, and administrative functions.
 * 
 * Author: Mac McCoy (macfarley)
 * Description: Express.js server with MongoDB database for sleep tracking app
 * 
 * Key Features:
 * - JWT-based authentication with role-based access control
 * - Sleep session tracking and dream journaling
 * - User bedroom environment management
 * - Administrative user management
 * - Secure password handling with bcrypt
 * ============================================================================
 */

// Load environment variables from .env file before anything else
require('dotenv').config();

// ====================
// EXTERNAL DEPENDENCIES
// ====================
const express = require('express');      // Web framework for Node.js
const mongoose = require('mongoose');    // MongoDB object modeling library
const cors = require('cors');           // Cross-Origin Resource Sharing middleware
const logger = require('morgan');       // HTTP request logging middleware
const helmet = require('helmet');       // Security middleware for HTTP headers

// ====================
// INTERNAL ROUTE CONTROLLERS
// ====================
const authRouter = require('./controllers/auth');           // Authentication routes (login/register)
const adminRouter = require('./controllers/admin');         // Admin-only user management routes
const userRouter = require('./controllers/users');          // User profile and data routes
const bedroomRouter = require('./controllers/bedrooms');    // Bedroom environment management routes
const gotobedRouter = require('./controllers/goToBed');     // Sleep session initiation routes
const sleepDataRouter = require('./controllers/sleepData'); // Sleep tracking and data routes

// ====================
// AUTHENTICATION MIDDLEWARE
// ====================
const verifyToken = require('./middleware/verifyToken');   // JWT token verification middleware
const requireAdmin = require('./middleware/requireAdmin'); // Admin role requirement middleware

// ====================
// EXPRESS APPLICATION INITIALIZATION
// ====================
const app = express();

// ====================
// DATABASE CONNECTION SETUP
// ====================

/**
 * MongoDB connection configuration
 * Uses connection string from environment variables for security
 */
const mongoURI = process.env.MONGODB_URI;

// Validate that MongoDB URI is provided
if (!mongoURI) {
  console.error('❌ FATAL ERROR: MONGODB_URI environment variable is not set');
  console.error('   Please check your .env file and ensure MONGODB_URI is defined');
  process.exit(1); // Exit with error code
}

// Validate that JWT secret is provided
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not set');
  console.error('   Please check your .env file and ensure JWT_SECRET is defined');
  process.exit(1); // Exit with error code
}

/**
 * Connect to MongoDB database
 * Uses modern connection syntax without deprecated options
 */
try {
  mongoose.connect(mongoURI);
  console.log('🔄 Attempting to connect to MongoDB...');
} catch (error) {
  console.error('❌ Failed to initiate MongoDB connection:', error.message);
  process.exit(1);
}

/**
 * Database connection event handlers
 * These provide feedback about the database connection status
 */
mongoose.connection.on('connected', () => {
  console.log(`✅ Successfully connected to MongoDB database: ${mongoose.connection.name}`);
  console.log(`📊 Database host: ${mongoose.connection.host}:${mongoose.connection.port}`);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('   This may cause API requests to fail');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection lost. Attempting to reconnect...');
});

/**
 * Graceful shutdown handling
 * Ensures database connections are properly closed when the server stops
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

// ====================
// SECURITY & MIDDLEWARE SETUP
// ====================

/**
 * Helmet: Sets various HTTP headers to secure the app
 * Helps protect against common vulnerabilities like XSS, clickjacking, etc.
 */
app.use(helmet());

/**
 * CORS: Enable Cross-Origin Resource Sharing
 * Allows frontend applications from different domains to access this API
 * In production, this should be configured with specific allowed origins
 */
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || false  // Only allow specific frontend in production
    : true,  // Allow all origins in development
  credentials: true  // Allow cookies and authorization headers
}));

/**
 * JSON Parser: Parse incoming requests with JSON payloads
 * Limits payload size to prevent DoS attacks via large payloads
 */
app.use(express.json({ 
  limit: '10mb',  // Reasonable limit for API requests
  strict: true    // Only parse arrays and objects
}));

/**
 * URL-encoded Parser: Parse incoming requests with URL-encoded payloads
 * Used for form submissions and some API clients
 */
app.use(express.urlencoded({ 
  extended: true,  // Allow rich objects and arrays
  limit: '10mb'    // Same limit as JSON for consistency
}));

/**
 * Morgan Logger: Log HTTP requests for debugging and monitoring
 * Format: method url status response-time - response-size
 */
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ====================
// API ROUTE DEFINITIONS
// ====================

/**
 * Health Check Route
 * Simple endpoint to verify the server is running and responsive
 * Useful for load balancers and monitoring systems
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

/**
 * Legacy test route for debugging
 * TODO: Remove this in production
 */
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// -------- PUBLIC ROUTES (No Authentication Required) --------

/**
 * Authentication Routes
 * Handles user registration, login, and password reset
 * These routes are public and don't require JWT tokens
 */
app.use('/auth', authRouter);

// -------- PROTECTED ROUTES (Require Valid JWT Token) --------

/**
 * User Profile Routes
 * Allows users to view and update their own profile information
 * Requires valid JWT token for access
 */
app.use('/users', verifyToken, userRouter);

/**
 * Bedroom Management Routes
 * Handles CRUD operations for user bedroom environments
 * Each user can only access their own bedrooms
 */
app.use('/bedrooms', verifyToken, bedroomRouter);

/**
 * Sleep Session Initiation Routes
 * Handles starting new sleep sessions and transitioning to sleep mode
 * Requires authentication to link sessions to specific users
 */
app.use('/gotobed', verifyToken, gotobedRouter);

/**
 * Sleep Data Management Routes
 * Comprehensive sleep tracking data management
 * Includes viewing, updating, and deleting sleep sessions
 * Note: This router includes its own verifyToken middleware
 */
app.use('/sleep-data', sleepDataRouter);

// -------- ADMIN ROUTES (Require JWT Token + Admin Role) --------

/**
 * Administrative Routes
 * User management, system monitoring, and admin-only functions
 * Requires both valid JWT token AND admin role for access
 */
app.use('/admin', verifyToken, requireAdmin, adminRouter);

// ====================
// ERROR HANDLING MIDDLEWARE
// ====================

/**
 * 404 Handler for undefined routes
 * Catches any requests to routes that don't exist
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableRoutes: [
      'GET /health - Server health check',
      'POST /auth/sign-up - User registration',
      'POST /auth/sign-in - User login',
      'GET /users/* - User routes (requires auth)',
      'GET /bedrooms/* - Bedroom routes (requires auth)',
      'GET /sleep-data/* - Sleep data routes (requires auth)',
      'GET /gotobed/* - Sleep session routes (requires auth)',
      'GET /admin/* - Admin routes (requires admin auth)'
    ]
  });
});

/**
 * Global Error Handler
 * Catches and handles all errors that occur during request processing
 * Provides consistent error response format across the entire application
 */
app.use((err, req, res, next) => {
  // Log the full error details for server-side debugging
  console.error('🚨 ERROR OCCURRED:');
  console.error('   Timestamp:', new Date().toISOString());
  console.error('   Request:', req.method, req.originalUrl);
  console.error('   User:', req.user ? req.user.username : 'Not authenticated');
  console.error('   Error:', err.message);
  console.error('   Stack:', err.stack);

  // Determine error status code
  let statusCode = err.status || err.statusCode || 500;
  let errorMessage = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation errors
    statusCode = 400;
    errorMessage = 'Validation failed: ' + Object.values(err.errors).map(e => e.message).join(', ');
  } else if (err.name === 'CastError') {
    // Mongoose cast errors (invalid ObjectId, etc.)
    statusCode = 400;
    errorMessage = 'Invalid data format provided';
  } else if (err.code === 11000) {
    // MongoDB duplicate key errors
    statusCode = 409;
    errorMessage = 'Duplicate entry: A record with this information already exists';
  } else if (err.name === 'JsonWebTokenError') {
    // JWT-related errors
    statusCode = 401;
    errorMessage = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    // Expired JWT tokens
    statusCode = 401;
    errorMessage = 'Authentication token has expired';
  }

  // Send error response to client
  res.status(statusCode).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && {
      // Include additional debug info in development
      details: err.stack,
      timestamp: new Date().toISOString()
    })
  });
});

// ====================
// SERVER STARTUP
// ====================

/**
 * Start the Express server
 * Uses environment variable for port or defaults to 3000
 */
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log('🌙 DREAMWEAVER BACKEND SERVER');
  console.log('🚀 ================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 API base URL: http://localhost:${PORT}`);
  console.log('🚀 ================================');
});

/**
 * Handle server startup errors
 */
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('   Please choose a different port or stop the other process');
  } else {
    console.error('❌ Server startup error:', error.message);
  }
  process.exit(1);
});

/**
 * Export the app for testing purposes
 * Allows the application to be imported and tested in other files
 */
module.exports = app;
