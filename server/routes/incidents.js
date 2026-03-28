const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');

// GET /api/incidents/area
router.get('/area', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5000, timeOfDay } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const radiusInMeters = Math.min(Number(radius), 15000);
    // Convert meters to radians for MongoDB $centerSphere (Earth radius is approx 6,378,100 meters)
    const radiusInRadians = radiusInMeters / 6378100;

    const query = {
      location: {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
        }
      }
    };

    if (timeOfDay) {
      query.timeOfDay = timeOfDay;
    }

    const incidents = await Incident.find(query)
      .sort({ severity: -1, reportedAt: -1 })
      .limit(200)
      .select('_id location category severity timeOfDay reportedAt upvotes isVerified source');

    res.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Server error fetching incidents' });
  }
});

// POST /api/incidents
router.post('/', auth, async (req, res) => {
  try {
    const { latitude, longitude, category, severity, description, isAnonymous } = req.body;
    let { reportedAt } = req.body;

    // Validations
    const validCategories = ['harassment', 'theft', 'assault', 'unsafe_area', 'poor_lighting', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (![1, 2, 3].includes(Number(severity))) {
      return res.status(400).json({ error: 'Severity must be 1, 2, or 3' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    reportedAt = reportedAt ? new Date(reportedAt) : new Date();
    
    // Create new incident (pre-save hook automatically calculates timeOfDay based on reportedAt)
    const newIncident = new Incident({
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      category,
      severity: Number(severity),
      description,
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
      reportedAt,
      source: 'user'
    });

    await newIncident.save();
    res.status(201).json(newIncident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Server error creating incident' });
  }
});

// POST /api/incidents/:id/upvote
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true } // Returns the updated document
    );

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json({ upvotes: incident.upvotes });
  } catch (error) {
    console.error('Error upvoting incident:', error);
    res.status(500).json({ error: 'Server error upvoting incident' });
  }
});

module.exports = router;
