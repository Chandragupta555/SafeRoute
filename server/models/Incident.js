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
  safetyScore: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  experienceText: {
    type: String,
    maxlength: 500
  },
  transportMode: {
    type: String,
    enum: ['walking', 'auto', 'cab', 'bus', 'bike'],
    required: true
  },
  severity: {
    type: Number,
    min: 1,
    max: 3,
    required: true
  },
  timeOfIncident: {
    type: Date,
    required: true
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
incidentSchema.index({ timeOfIncident: -1, severity: -1 });

// Virtuals
incidentSchema.virtual('timeOfDay').get(function() {
  if (!this.timeOfIncident) return 'night';
  const hour = this.timeOfIncident.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
});

incidentSchema.virtual('riskWeight').get(function() {
  let multiplier = 1.0;
  if (this.safetyScore <= 3) multiplier = 2.0;
  else if (this.safetyScore <= 6) multiplier = 1.5;
  
  return (11 - this.safetyScore) * multiplier;
});

// Configure JSON serialization to include virtuals
incidentSchema.set('toJSON', { virtuals: true });
incidentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Incident', incidentSchema);
