// Load environment variables from .env file
require('dotenv').config();

// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

// Import route controllers
const authRouter = require('./controllers/auth');
const adminRouter = require('./controllers/admin');
const userRouter = require('./controllers/users');
const bedroomRouter = require('./controllers/bedrooms');
const gotobedRouter = require('./controllers/goToBed');

// Import middleware
const verifyToken = require('./middleware/verifyToken');
const requireAdmin = require('./middleware/requireAdmin');

// Initialize Express app
const app = express();

// ====================
// Database Connection
// ====================

// Connect to MongoDB using the URI from environment variables
mongoose.connect(process.env.MONGODB_URI);

// Log successful connection
mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}.`);
});

// ====================
// Middleware
// ====================

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Log HTTP requests
app.use(logger('dev'));

// ====================
// Idle Timer Middleware
// ====================

// This timer will shut down the server if no requests are received for 5 minutes
let idleTimer;

// Function to reset the idle timer
const resetIdleTimer = () => {
  // Clear any existing timer
  if (idleTimer) clearTimeout(idleTimer);

  // Set a new timer for 5 minutes (300,000 ms)
  idleTimer = setTimeout(() => {
    console.log('No requests for 5 minutes. Disconnecting from MongoDB and shutting down server.');
    mongoose.disconnect().then(() => process.exit(0));
  }, 5 * 60 * 1000);
};

// Middleware to reset the idle timer on every request
app.use((req, res, next) => {
  resetIdleTimer();
  next();
});

// Start the idle timer when the server starts
resetIdleTimer();

// ====================
// Routes
// ====================

// -------- Public Routes (No Authentication Required) --------
app.use('/auth', authRouter);

// -------- Protected Routes (Require Login) --------
app.use('/users', verifyToken, userRouter);
app.use('/bedrooms', verifyToken, bedroomRouter);
app.use('/gotobed', verifyToken, gotobedRouter);

// -------- Admin Routes (Require Login + Admin Role) --------
app.use('/admin', verifyToken, requireAdmin, adminRouter);

// ====================
// Start Server
// ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}`);
});
