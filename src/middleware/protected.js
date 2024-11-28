import express from 'express';
import authMiddleware from './middleware/authMiddleware.js';





const app = express();

app.use(express.json()); // To parse JSON body

// A protected route that requires authentication
app.get('/api/protected', authMiddleware, async (req, res) => {
    // Since the user is authenticated, you can access req.user
    res.json({ message: 'Welcome to the protected route!', user: req.user });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
