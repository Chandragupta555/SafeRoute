const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// PUT /api/users/trusted-contacts
router.put('/trusted-contacts', auth, async (req, res) => {
  try {
    let { contacts } = req.body;

    // FIX: If the frontend sends a single object instead of an array, wrap it.
    if (req.body.name && req.body.phone) {
      contacts = [req.body];
    }

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts must be an array' });
    }

    if (contacts.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 trusted contacts allowed' });
    }

    const cleanedContacts = [];
    for (const contact of contacts) {
      if (!contact.name || !contact.phone) {
        return res.status(400).json({ error: 'Each contact must have a name and phone' });
      }

      // FIX: Improved regex to handle spaces and +91 more gracefully
      let phoneStr = String(contact.phone).replace(/\s+/g, '');
      if (phoneStr.startsWith('+91')) phoneStr = phoneStr.slice(3);
      else if (phoneStr.startsWith('91') && phoneStr.length === 12) phoneStr = phoneStr.slice(2);

      if (!/^\d{10}$/.test(phoneStr)) {
        return res.status(400).json({ error: `Invalid 10-digit phone number for ${contact.name}` });
      }

      cleanedContacts.push({ name: contact.name, phone: phoneStr });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Append instead of replace if you want to add one by one
    user.trustedContacts = cleanedContacts;
    await user.save();

    res.json(user.trustedContacts);
  } catch (error) {
    console.error('Error updating contacts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
