// pendingdrivers.js
import express from 'express';
import db from '../config/db.mjs';
import authMiddleware from '../middleware/authMiddleware.js';

const adminDashboardRouter = express.Router();

// Export the router for use in other modules


// Route to get pending driver applications
adminDashboardRouter.get('/pending-drivers', authMiddleware, async (req, res) => {
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

export default adminDashboardRouter;
