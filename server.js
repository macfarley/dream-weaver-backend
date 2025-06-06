const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');
const authRoutes = require('./controllers/auth'); // Importing auth routes
const bedroomRoutes = require('./controllers/bedrooms'); // Importing bedroom routes
const goToBedRoutes = require('./controllers/goToBed'); // Importing goToBed routes

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware that lets the app query from a different domain
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));app.use(logger('dev'));

// Routes go here
app.use('/auth', authRoutes); // Use the auth routes
app.use('/bedrooms', bedroomRoutes); // Use the bedroom routes
app.use('/goToBed', goToBedRoutes); // Use the goToBed routes

//listening on port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The express app is ready on port ${PORT}!`);
});
// Disconnect from MongoDB after idle for 5 minutes
let idleTimer;

const resetIdleTimer = () => {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    console.log('No requests for 5 minutes. Disconnecting from MongoDB and shutting down server.');
    mongoose.disconnect().then(() => {
      process.exit(0);
    });
  }, 5 * 60 * 1000); // 5 minutes
};

// Reset timer on every request
app.use((req, res, next) => {
  resetIdleTimer();
  next();
});

// Start the timer initially
resetIdleTimer();