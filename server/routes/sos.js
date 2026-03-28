const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/sos/send
router.post('/send', auth, async (req, res) => {
  try {
    console.log('SOS Payload:', req.body);
    const latitude = req.body.latitude || req.body.lat;
    const longitude = req.body.longitude || req.body.lng;
    const isTest = req.body.isTest === true;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required for SOS' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.trustedContacts || user.trustedContacts.length === 0) {
      return res.status(400).json({ error: 'No trusted contacts added. Please add contacts in your profile first.' });
    }

    const timeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    const message = isTest 
      ? `TEST ALERT from SafeRoute — ignore this message. ${user.name} is testing their emergency contacts. Location: ${mapsLink} — Time: ${timeString}.`
      : `SAFEROUTE ALERT: ${user.name} has triggered an emergency SOS. Last location: ${mapsLink} — Time: ${timeString}. Please contact them immediately.`;

    let contactsNotified = 0;
    let failedContacts = 0;

    for (const contact of user.trustedContacts) {
      try {
        await axios.post('https://www.fast2sms.com/dev/bulkV2', {
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: contact.phone
        }, {
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        contactsNotified++;
      } catch (smsError) {
        console.error(`Failed to send SMS to ${contact.phone}:`, smsError.response?.data || smsError.message);
        failedContacts++;
      }
    }

    res.json({ success: true, message: isTest ? 'Test SOS sent' : 'SOS sent', contactsNotified, failedContacts });
  } catch (error) {
    console.error('Error triggering SOS:', error);
    res.status(500).json({ error: 'Server error triggering SOS' });
  }
});

module.exports = router;
