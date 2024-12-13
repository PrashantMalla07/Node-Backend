// src/middleware/authenticateJWT.js

import jwt from 'jsonwebtoken'; // Using ES module import

// Middleware to authenticate JWT token
const authenticateJWT = (req, res, next) => {
    // Get token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify token and decode payload
        const decoded = jwt.verify(token, 'your_secret_key'); // Replace 'your_secret_key' with your actual secret
        req.user = decoded; // Attach user data to the request object
        next(); // Call the next middleware or route handler
    } catch (error) {
        console.error('Invalid or expired token:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export default authenticateJWT;  // Use ES module export
