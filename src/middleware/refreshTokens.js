import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import db from '../config/db.mjs';

const refreshTokenRouter = express.Router(); // Ensure you have a correct reference for your database

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

refreshTokenRouter.post('/refresh-token', [
  body('refreshToken').isString().withMessage('Refresh token is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { refreshToken } = req.body;

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const userId = decoded.id; // Extract user ID from the decoded token

    // Optionally check if the user exists in the database (if necessary)
    const [rows] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
    }

    // Issue a new JWT token
    const newToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' }); // Set your token expiration time
    const newRefreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' }); // Set your refresh token expiration time

    res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    // Handle token verification errors, e.g., expired or invalid token
    res.status(401).json({ error: 'Invalid refresh token', details: error.message });
  }
});

export default refreshTokenRouter;
