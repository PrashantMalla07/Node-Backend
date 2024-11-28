import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Verify the token
    req.user = decoded; // Attach user data to the request object
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};


