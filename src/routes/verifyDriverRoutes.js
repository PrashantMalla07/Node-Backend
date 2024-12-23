// verifydriver.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/db.mjs';
import authMiddleware from '../middleware/authMiddleware.js';

const verifyDriverRouter = express.Router();

// Admin verification of a driver
verifyDriverRouter.post('/verify-driver', authMiddleware, [
  body('userId').isInt(),
  body('isVerified').isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, isVerified } = req.body;
  const verificationStatus = isVerified ? 1 : 0; // Convert boolean to 1 (verified) or 0 (unverified)

  try {
    // Check if the user has admin rights
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin rights required' });
    }

    // Check if the driver exists
    const [driver] = await db.query('SELECT * FROM drivers WHERE id = ?', [userId]);
    if (driver.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Update the driver's verification status
    await db.query('UPDATE drivers SET is_verified = ? WHERE id = ?', [verificationStatus, userId]);
    const message = isVerified ? 'Driver has been verified successfully.' : 'Driver verification has been rejected.';
    res.status(200).json({ message });
  } catch (err) {
    console.error('Error verifying driver:', err.message);
    res.status(500).json({ error: 'Failed to update driver verification status', details: err.message });
  }
});

export default verifyDriverRouter;
