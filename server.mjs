import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import jwt from "jsonwebtoken";
import db from './src/config/db.mjs'; // Use the correct path to your config file
import authMiddleware from './src/middleware/authMiddleware.js';
import UserModel from './src/models/userModel.js';
import adminDashboardRoutes from './src/routes/adminDashboardRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import switchToDriverRoutes from './src/routes/switchToDriver.js';
import verifyDriverRoutes from './src/routes/verifyDriverRoutes.js';
// Initialize app
const app = express();

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
// app.use(express.static(path.join(__dirname, 'public')));


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

// **User Status Endpoint**
app.post('/api/user-status', authMiddleware, async (req, res) => {
    const userId = req.user.id; // The user ID from the authenticated request

    try {
        // Fetch user details by user ID
        const [userDetails] = await db.execute('SELECT id, is_driver, driver_status, verification_data_filled FROM users WHERE id = ?', [userId]);

        if (userDetails.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Respond with user status
        res.status(200).json({
            isDriver: userDetails[0].is_driver,
            driverStatus: userDetails[0].driver_status,
            verificationDataFilled: userDetails[0].verification_data_filled,
        });
    } catch (err) {
        console.error('Error fetching user status:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// **Login Route**
app.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    // Check for missing identifier or password
    if (!identifier || !password) {
        return res.status(400).json({ message: 'Identifier and password are required' });
    }

    try {
        // Find user by email or phone number
        const user = await UserModel.findByEmailOrPhone(identifier);

        // Check if user exists
        if (!user) {
            return res.status(401).json({ message: 'Invalid email/phone number or password' });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email/phone number or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin === 1 },
            secretKey,
            { expiresIn: '1y' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phoneNumber: user.phone_number,
                isAdmin: user.is_admin === 1
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
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
app.post('/update-admin-status/:id', async (req, res) => {
    const { id } = req.params;
    const { isAdmin } = req.body;
  
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: 'Invalid isAdmin value' });
    }
  
    try {
      const result = await UserModel.updateAdminStatus(id, isAdmin);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ message: 'User admin status updated successfully' });
    } catch (error) {
      console.error('Error updating admin status:', error.message);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
  
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
