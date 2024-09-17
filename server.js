const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors'); // Import CORS
const path = require('path');
const userRoutes = require('./src/routes/userRoutes');
require('dotenv').config();
const UserModel = require('./src/models/userModel'); // Adjust the path based on your file structure


// Initialize app
const app = express();

// Use CORS
app.use(cors()); // Enable CORS for all routes

// Middleware
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_DATABASE, 
    port: 3306 
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('MySQL connected');
});

// Middleware to add the database connection to request objects
app.use((req, res, next) => {
    req.db = db;
    next();
});

app.post('/register', (req, res) => {
    const { first_name, last_name, email, phone_number, password } = req.body;

    if (!first_name || !last_name || !email || !phone_number) {
        return res.status(400).json({ message: 'Name, email, and phone number are required' });
    }

    // Check if the phone number already exists
    const checkQuery = 'SELECT * FROM users WHERE phone_number = ?';
    
    db.query(checkQuery, [phone_number], (err, result) => {
        if (err) {
            console.error('Error checking phone number in MySQL:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: 'Phone number already in use' });
        }

        // If phone number is not in use, proceed to insert the user
        const insertQuery = 'INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)';
        db.query(insertQuery, [first_name, last_name, email, phone_number, password], (err, result) => {
            if (err) {
                console.error('Error inserting user into MySQL:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            return res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
        });
    });
});
app.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identifier and password are required' });
        }

        const user = await UserModel.findByEmailOrPhone(identifier);
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({
            message: 'Login successful',
            userId: user.id,
            email: user.email,
            phoneNumber: user.phone_number
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/users', (req, res) => {
    const query = 'SELECT * FROM users';

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching users from MySQL:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        return res.status(200).json(result);
    });
})

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
