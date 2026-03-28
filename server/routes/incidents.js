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
      // Map the string to actual 24-hour integers since timeOfDay is just a virtual
      let matchHours;
      if (timeOfDay === 'morning') matchHours = [5, 6, 7, 8, 9, 10, 11];
      else if (timeOfDay === 'afternoon') matchHours = [12, 13, 14, 15, 16, 17];
      else if (timeOfDay === 'evening') matchHours = [18, 19, 20];
      else if (timeOfDay === 'night') matchHours = [21, 22, 23, 0, 1, 2, 3, 4];

      if (matchHours) {
        // Use MongoDB $expr to extract the hour from the timeOfIncident Date object
        query.$expr = { $in: [{ $hour: "$timeOfIncident" }, matchHours] };
      }
    }

    const incidents = await Incident.find(query)
      .sort({ severity: -1, timeOfIncident: -1 })
      .limit(200)
      .select('_id location safetyScore experienceText transportMode severity timeOfIncident upvotes isVerified source');

    res.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Server error fetching incidents' });
  }
});

// GET /api/incidents/route-experiences
router.get('/route-experiences', auth, async (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2, mode } = req.query;

    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return res.status(400).json({ error: 'Start and end coordinates required.' });
    }

    const minLat = Math.min(Number(lat1), Number(lat2)) - 0.005;
    const maxLat = Math.max(Number(lat1), Number(lat2)) + 0.005;
    const minLng = Math.min(Number(lng1), Number(lng2)) - 0.005;
    const maxLng = Math.max(Number(lng1), Number(lng2)) + 0.005;

    const query = {
      location: {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat]
          ]
        }
      }
    };

    if (mode) {
      query.transportMode = mode;
    }

    const experiences = await Incident.find(query)
      .sort({ timeOfIncident: -1 })
      .limit(50)
      .select('_id location safetyScore experienceText transportMode timeOfIncident upvotes isVerified isAnonymous source');

    res.json(experiences);
  } catch (error) {
    console.error('Error fetching route experiences:', error);
    res.status(500).json({ error: 'Server error fetching route experiences' });
  }
});

// GET /api/incidents/count
router.get('/count', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5000, days = 7 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const radiusInMeters = Math.min(Number(radius), 15000);
    const radiusInRadians = radiusInMeters / 6378100;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const query = {
      location: {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
        }
      },
      timeOfIncident: { $gte: daysAgo }
    };

    const count = await Incident.countDocuments(query);
    res.json({ count });
  } catch (error) {
    console.error('Error counting incidents:', error);
    res.status(500).json({ error: 'Server error counting incidents' });
  }
});

// POST /api/incidents
router.post('/', auth, async (req, res) => {
  try {
    const { latitude, longitude, safetyScore, experienceText, transportMode, severity, isAnonymous, timeOfIncident } = req.body;

    // Validations
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const validModes = ['walking', 'auto', 'cab', 'bus', 'bike'];
    if (!validModes.includes(transportMode)) {
      return res.status(400).json({ error: 'Invalid transport mode' });
    }

    if (safetyScore < 1 || safetyScore > 10) {
      return res.status(400).json({ error: 'Safety score must be between 1 and 10' });
    }

    const parseTime = timeOfIncident ? new Date(timeOfIncident) : new Date();

    const newIncident = new Incident({
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      safetyScore: Number(safetyScore),
      experienceText,
      transportMode,
      severity: Number(severity || 2),
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
      timeOfIncident: parseTime,
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
