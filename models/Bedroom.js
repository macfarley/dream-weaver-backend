const mongoose = require('mongoose');

// Define the schema for the bedroom model
const bedroomSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bedroomName: { 
    type: String, 
    required: true, 
    default: 'My Bedroom' 
  },
  temperature: { 
    type: Number, 
    required: true, 
    min: 50, 
    max: 100,
    default: 72 // Average comfortable room temperature
  },
  lightLevel: { 
    type: String,
    required: true,
    enum: ['pitch black', 'very dim', 'dim', 'normal', 'bright', 'daylight'],
    default: 'dim'
  },
  noiseLevel: { 
    type: String,
    required: true,
    enum: ['silent', 'very quiet', 'quiet', 'moderate', 'loud', 'very loud'],
    default: 'quiet'
  },
  mattressType: { 
    type: String, 
    required: true, 
    enum: ['memory foam', 'spring', 'latex', 'hybrid', 'air', 'water'],
    default: 'memory foam'
  },
  bedSize: { 
    type: String, 
    required: true, 
    enum: ['twin', 'full', 'queen', 'king', 'california king'],
    default: 'queen'
  },
  pillows: { 
    type: String, 
    required: false, 
    enum: ['prison (none)', 'one', 'two', 'three', 'four', 'five', 'princess (can barely see the mattress)'],
    default: 'two'
  },
});

// Create the Bedroom model
const Bedroom = mongoose.model('Bedroom', bedroomSchema);

// Export the Bedroom model
module.exports = Bedroom;
