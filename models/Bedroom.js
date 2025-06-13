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
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    required: true,
    default: 'My Bedroom'
  },
  bedType: {
    type: String,
    required: true,
    enum: ['bean bag', 'sleeping bag', 'chair', 'couch', 'futon', 'bed'],
    default: 'bed'
  },
  mattressType: {
    type: String,
    enum: ['memory foam', 'spring', 'latex', 'hybrid', 'air', 'water'],
    default: 'memory foam'
  },
  bedSize: {
    type: String,
    enum: ['twin', 'full', 'queen', 'king', 'california king'],
    default: 'queen'
  },
  temperature: {
    type: Number,
    required: true,
    min: 50,
    max: 100,
    default: 72
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
  pillows: {
    type: String,
    enum: ['prison (none)', 'one', 'two', 'three', 'four', 'five', 'princess (can barely see the mattress)'],
    default: 'two'
  },
  favorite: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
});

// Require mattressType and bedSize if bedType is 'bed'
bedroomSchema.pre('validate', function (next) {
  if (this.bedType === 'bed') {
    if (!this.mattressType) {
      this.invalidate('mattressType', 'mattressType is required when bedType is "bed"');
    }
    if (!this.bedSize) {
      this.invalidate('bedSize', 'bedSize is required when bedType is "bed"');
    }
  }
  next();
});

// Update lastUpdatedAt before save/update
bedroomSchema.pre('save', function (next) {
  this.lastUpdatedAt = new Date();
  next();
});
bedroomSchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastUpdatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Bedroom', bedroomSchema);
