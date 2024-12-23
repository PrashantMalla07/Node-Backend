import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db.mjs';

const authRouter = express.Router();

const secretKey = process.env.JWT_SECRET || 'your-secret-key';

// Refresh token route
authRouter.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, secretKey, { ignoreExpiration: true });
    
    // Fetch user from database
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: rows[0].id, email: rows[0].email },
      secretKey,
      { expiresIn: '1y' }
    );

    res.status(200).json({ token: newToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

export default authRouter;
