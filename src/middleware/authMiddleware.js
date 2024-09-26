const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token is malformed' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await db.query('SELECT is_admin FROM users WHERE id = ?', [decoded.id]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = {
            id: decoded.id,
            isAdmin: rows[0].is_admin
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired', details: err.message });
        }
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid token', details: err.message });
    }
};

module.exports = authMiddleware;
