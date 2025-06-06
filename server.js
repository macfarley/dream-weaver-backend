const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');
const authRoutes = require('./controllers/auth'); // Importing auth routes
const bedroomRoutes = require('./controllers/bedrooms'); // Importing bedroom routes

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(cors());
app.use(express.json());
app.use(logger('dev'));

// Routes go here
app.use('/auth', authRoutes); // Use the auth routes
app.use('/bedrooms', bedroomRoutes); // Use the bedroom routes

//listening on port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The express app is ready on port ${PORT}!`);
});
