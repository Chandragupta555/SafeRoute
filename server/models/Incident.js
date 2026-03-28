const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  category: {
    type: String,
    enum: ['harassment', 'theft', 'assault', 'unsafe_area', 'poor_lighting', 'other'],
    required: true
  },
  severity: {
    type: Number,
    min: 1,
    max: 3,
    required: true
  },
  description: {
    type: String,
    maxlength: 300
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  upvotes: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['user', 'ncrb_seed', 'news_seed'],
    default: 'user'
  }
});

// Indexes
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ reportedAt: -1, severity: -1 });

// Pre-save middleware to auto-calculate timeOfDay based on reportedAt hour
incidentSchema.pre('save', function(next) {
  if (this.reportedAt) {
    const hour = this.reportedAt.getHours();
    
    // morning: 5-11, afternoon: 12-17, evening: 18-20, night: 21-4
    if (hour >= 5 && hour < 12) {
      this.timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
      this.timeOfDay = 'afternoon';
    } else if (hour >= 18 && hour < 21) {
      this.timeOfDay = 'evening';
    } else {
      this.timeOfDay = 'night';
    }
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);
