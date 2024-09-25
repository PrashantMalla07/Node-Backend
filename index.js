const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const authMiddleware = require('./src/middleware/authMiddleware');

app.get('/test-token', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'Token is valid', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
