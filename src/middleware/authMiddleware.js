const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Ensure this path is correct

const authMiddleware = async (req, res, next) => {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Format of token should be "Bearer token"
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from the database to check admin status
        const [rows] = await db.query('SELECT is_admin FROM users WHERE id = ?', [decoded.id]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Add user details to the request object
        req.user = {
            id: decoded.id,
            isAdmin: rows[0].is_admin // Ensure column name matches
        };

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid token', details: err.message });
    }
};

module.exports = authMiddleware;
