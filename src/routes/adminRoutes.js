import bcrypt from 'bcrypt';
import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/db.mjs';
import authMiddleware from '../middleware/authMiddleware.js';

const saltRounds = 10; // Ensure this matches the salt rounds used during registration

const adminRouter = express.Router();

// Route to make a user an admin or remove admin status
adminRouter.post('/set-admin', authMiddleware, [
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

// Route to check admin status
adminRouter.get('/check-admin', authMiddleware, (req, res) => {
  res.status(200).json({ isAdmin: req.user.isAdmin });
});

// Route to update admin password
adminRouter.post('/update-admin-password', authMiddleware, [
  body('userId').isInt().withMessage('Invalid user ID'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, newPassword } = req.body;

  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin rights required' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
    const [result] = await db.query(updateQuery, [hashedPassword, userId]);

    if (result.affectedRows === 0) {
      throw new Error('Admin user not found or password update failed');
    }

    res.status(200).json({ message: 'Admin password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default adminRouter;
