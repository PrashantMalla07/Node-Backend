const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// Route to make a user an admin or remove admin status
router.post('/set-admin', authMiddleware, [
  body('userId').isInt().withMessage('Invalid user ID'),
  body('isAdmin').isBoolean().withMessage('Admin status must be a boolean'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, isAdmin } = req.body;

  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin rights required' });
    }

    // Update the user's admin status
    await db.query('UPDATE users SET is_admin = ? WHERE id = ?', [isAdmin, userId]);

    res.status(200).json({ message: 'User admin status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/check-admin', authMiddleware, (req, res) => {
    res.status(200).json({ isAdmin: req.user.isAdmin });
  });

module.exports = router;
