const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./src/routes/userRoutes');
require('dotenv').config();
const UserModel = require('./src/models/userModel');
const session = require('express-session');
const authMiddleware = require('./src/middleware/authMiddleware');
const bcrypt = require('bcrypt');
const db = require('./src/config/db'); // Use the correct path to your config file
const switchToDriverRoutes = require('./src/routes/switchToDriver');
const verifyDriverRoutes = require('./src/routes/verifyDriverRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { body, validationResult } = require('express-validator');
const authRoutes = require('./src/routes/authRoutes');
const adminDashboardRoutes = require('./src/routes/adminDashboardRoutes'); 
// Initialize app
const app = express();
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'your-secret-key';
// Use CORS
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('phone_number').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { first_name, last_name, email, phone_number, password } = req.body;
  
    try {
      // Check if the phone number already exists
      const checkPhoneQuery = 'SELECT * FROM users WHERE phone_number = ?';
      const [phoneResults] = await db.execute(checkPhoneQuery, [phone_number]);
  
      if (phoneResults.length > 0) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
  
      // Check if the email already exists
      const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
      const [emailResults] = await db.execute(checkEmailQuery, [email]);
  
      if (emailResults.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
  
      // If phone number and email are not in use, proceed to insert the user
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = 'INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)';
      const [insertResults] = await db.execute(insertQuery, [first_name, last_name, email, phone_number, hashedPassword]);
  
      return res.status(201).json({ message: 'User registered successfully', userId: insertResults.insertId });
    } catch (err) {
      console.error('Error inserting user into MySQL:', err.message);
      return res.status(500).json({ message: 'Database error' });
    }
  });
  app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Identifier and password are required' });
    }

    try {
        // Find user by email or phone number
        const user = await UserModel.findByEmailOrPhone(identifier);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email/phone number or password' });
        }

        // Generate JWT token with user id and isAdmin
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin === 1 }, // Payload includes isAdmin
            secretKey, // Secret key
            { expiresIn: '1h' } // Options
        );

        res.status(200).json({
            message: 'Login successful',
            token, // Include the token in the response
            user: {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phoneNumber: user.phone_number,
                isAdmin: user.is_admin === 1 // Include isAdmin in the user object
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/change-password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
        const userId = req.user.id;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await UserModel.updatePassword(userId, hashedNewPassword);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/api', switchToDriverRoutes); // Mount the router with '/api' or any other prefix you prefer
app.use('/api/admin', verifyDriverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/admin-dashboard', adminDashboardRoutes);
app.get('/users', async (req, res) => {
    try {
        const query = 'SELECT * FROM users';
        const [result] = await db.execute(query);
        return res.status(200).json(result);
    } catch (err) {
        console.error('Error fetching users from MySQL:', err);
        return res.status(500).json({ message: 'Database error' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
