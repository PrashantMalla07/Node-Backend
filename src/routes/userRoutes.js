const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

// Registration route
router.post('/register', UserController.register);

// Login route
router.post('/login', UserController.login); // Ensure this route exists

module.exports = router;
