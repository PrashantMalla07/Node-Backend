import dotenv from 'dotenv';
import express from 'express';
import authMiddleware from './src/middleware/authMiddleware';

dotenv.config()
const app = express();

app.get('/test-token', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'Token is valid', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
