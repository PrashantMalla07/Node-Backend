// pendingdrivers.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');

// Route to get pending driver applications
router.get('/pending-drivers', authMiddleware, async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin rights required' });
    }

    // Fetch pending driver applications
    const [results] = await db.query('SELECT * FROM drivers WHERE is_verified = 0');
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching pending drivers:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending drivers', details: err.message });
  }
});

module.exports = router;
