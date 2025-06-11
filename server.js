// Load environment variables from .env file
require('dotenv').config();

// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');
const helmet = require('helmet');

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

// Connect to MongoDB using the URI from environment variables with options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}.`);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// ====================
// Middleware
// ====================

// Use Helmet for basic security headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Log HTTP requests
app.use(logger('dev'));

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
// Error Handling Middleware
// ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ====================
// Start Server
// ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}`);
});
