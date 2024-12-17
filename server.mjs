import axios from 'axios';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import jwt from "jsonwebtoken";
import multer from 'multer';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { default as db, default as pool } from './src/config/db.mjs';
import authMiddleware from './src/middleware/authMiddleware.js';
import UserModel from './src/models/userModel.js';
import adminDashboardRoutes from './src/routes/adminDashboardRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import driverDetailRouter from './src/routes/driverDetailRoutes.js';
import driverLoginRouter from './src/routes/driverLogin.js';
import driverRegisterRouter from './src/routes/driverRegistration.js';
import notificationsRouter from './src/routes/notifications.js';
import paymentsRouter from './src/routes/payments.js';
import reviewsRouter from './src/routes/reviews.js';
import rideRequestsRouter from './src/routes/rideRequests.js';
import ridesRouter from './src/routes/rides.js';
import updateProfileRouter from './src/routes/updateProfile.js';
import userRoutes from './src/routes/userRoutes.js';
import verifyDriverRoutes from './src/routes/verifyDriverRoutes.js';
// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Initialize app
const app = express();

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
// Use CORS
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  bodyParser.json()(req, res, next);
});
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

      // Generate a random 4-digit UID
      const uid = Math.floor(1000 + Math.random() * 9000);

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database with the generated UID
      const insertQuery = 'INSERT INTO users (first_name, last_name, email, phone_number, password, uid) VALUES (?, ?, ?, ?, ?, ?)';
      const [insertResults] = await db.execute(insertQuery, [first_name, last_name, email, phone_number, hashedPassword, uid]);

      return res.status(201).json({ message: 'User registered successfully', userId: insertResults.insertId, uid });
  } catch (err) {
      console.error('Error inserting user into MySQL:', err.message);
      return res.status(500).json({ message: 'Database error' });
  }
});
// **User Status Endpoint**
app.post('/api/user-status', async (req, res) => {
    const userId = 6; // The user ID from the authenticated request or headers
  
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
  
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

      // Generate JWT token with the same secret key used for verification
      const token = jwt.sign(
          { id: user.id, email: user.email, isAdmin: user.is_admin === 1 },
          'your_secret_key',  // Ensure this is the same secret key
          { expiresIn: '1y' }
      );

      res.status(200).json({
          message: 'Login successful',
          token,
          user: {
            id: user.id, 
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
              phoneNumber: user.phone_number,
              isAdmin: user.is_admin === 1,
              uid:user.uid,
          }
      });
  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});
app.put('/api/user/update', authMiddleware, async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
  const userId = req.user.id; // Get the user ID from the authentication middleware

  // Validate the input fields
  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find the user and update the profile
    const user = await UserModel.findById(userId); // Find user by ID
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's details
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phoneNumber = phone;
    
    // Save the updated user back to the database
    await user.save();

    // Return a success response
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer storage setup
// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // Ensure the `uploads` directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to allow all image types


const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/bmp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // First check MIME type
  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);  // Allow the file if MIME type is valid
  }

  // Fallback to checking file extension
  if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.bmp'].includes(fileExtension)) {
    return cb(null, true);  // Allow the file if the extension is valid
  }

  // Reject the file if neither check passes
  return cb(new Error('Only image files are allowed!'), false);
};


// Initialize Multer
const upload = multer({ 
  storage: storage,
  
  limits: { fileSize: 20 * 1024 * 1024 } // Limit file size to 10MB
});




// Route to fetch user profile image
app.get('/api/user/:id/image', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT image_url FROM users WHERE id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database query error.', error: err });
    }

    if (results.length > 0 && results[0].image_url) {
      res.status(200).json({ image_url: results[0].image_url });
    } else {
      res.status(404).json({ message: 'Profile image not found.' });
    }
  });
});

// Route to upload user profile image
// Route to upload user profile image
app.post('/api/user/:id/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const query = 'UPDATE users SET image_url = ? WHERE id = ?';
  console.log('Updating image URL:', imageUrl, 'for user ID:', req.params.id);
  db.query(query, [imageUrl, req.params.id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database update error.', error: err });
    }
    console.log('Database updated successfully:', result);
    res.status(200).json({
      message: 'Image uploaded successfully.',
      image_url: imageUrl,
    });
  });
});


app.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirmation do not match' });
  }

  try {
    // Decode the token to get the user's ID
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer token
    if (!token) return res.status(401).json({ error: 'Token missing' });

    const decoded = jwt.verify(token, 'your_jwt_secret'); // Replace with your secret
    const userId = decoded.id; // Assuming the token contains the user's ID

    // Find the user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});
app.use('/api', userRoutes);
app.use('/api', driverRegisterRouter);  
app.use('/api', driverLoginRouter); 
app.use('/api/admin', verifyDriverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/api/rides', ridesRouter);
app.use('/api/ride-requests', rideRequestsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/drivers', driverDetailRouter);

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
app.get('/drivers', async (req, res) => {
  try {
      const query = 'SELECT * FROM drivers';
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
  app.get('/api/rides/history', async (req, res) => {
    const userId = req.user.id; // Assuming you're using JWT to authenticate the user
    try {
      // Query to fetch completed rides only
      const rides = await db.query('SELECT * FROM rides WHERE user_id = ? AND status = "completed"', [userId]);
  
      if (rides.length > 0) {
        res.json(rides); // Send the completed rides to the client
      } else {
        res.status(404).json({ message: "No completed rides found." });
      }
    } catch (err) {
      res.status(500).send('Error fetching ride history');
    }
  });
  
  app.get('/api/review/:ride_id', async (req, res) => {
    const rideId = req.params.ride_id;
    const userId = req.user.id; // Assuming you use middleware to authenticate and get the logged-in user's ID.
  
    try {
      // Query to check if the user has a review for the specific ride
      const query = 'SELECT * FROM reviews WHERE ride_id = ? AND user_id = ?';
      const [reviews] = await db.execute(query, [rideId, userId]);
  
      if (reviews.length === 0) {
        return res.status(404).json({ message: 'Review not found for this ride or unauthorized access.' });
      }
  
      res.status(200).json(reviews[0]); // Send the review data for the ride
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  

// Ensure this is included to parse the request body
app.post('/api/ride-requests/accept/:id', async (req, res) => {
  const rideRequestId = req.params.id;
  const driverUid = req.body.driver_uid; // Ensure this key is correctly used in the request

  console.log(`Accepting ride request with ID: ${rideRequestId} and Driver UID: ${driverUid}`);

  try {
    // Fetch the ride request to get user, pickup, and dropoff details
    const [rideRequest] = await pool.execute(
      'SELECT * FROM ride_requests WHERE id = ?',
      [rideRequestId]
    );

    if (rideRequest.length === 0) {
      return res.status(404).send('Ride request not found');
    }

    // Destructure the values from the ride request
    const { user_id, pickup_location, dropoff_location } = rideRequest[0];

    // Check for any undefined values
    if (user_id === undefined || driverUid === undefined || pickup_location === undefined || dropoff_location === undefined) {
      console.error('Missing required fields:', { user_id, driverUid, pickup_location, dropoff_location });
      return res.status(400).send('Missing required fields');
    }

    console.log('Inserting into rides:', { user_id, driverUid, pickup_location, dropoff_location });

    // Insert a new ride record into the `rides` table
    const [result] = await pool.execute(
      'INSERT INTO rides (user_id, driver_uid, pickup_location, dropoff_location, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, driverUid, pickup_location, dropoff_location, 'accepted']
    );

    // Update the status of the ride request to 'accepted'
    await pool.execute(
      'UPDATE ride_requests SET status = ? WHERE id = ?',
      ['accepted', rideRequestId]
    );

    console.log('Ride accepted successfully:', result);
    res.status(200).send('Ride request accepted and ride created successfully');
  } catch (err) {
    console.error('Error processing ride request:', err.message);
    res.status(500).send('Failed to accept ride request');
  }
});
// In your Node.js/Express backend
app.get('/api/rides/user/:userId', async (req, res) => {
  try {
    // Extract the userId from the URL parameter
    const userId = req.params.userId.trim(); // Get the userId from the URL
    console.log('Received User ID from URL:', userId);  // Log the userId

    // SQL query to fetch rides based on the user_id
    const sql = 'SELECT * FROM rides WHERE user_id = ?';
    console.log('Executing SQL Query:', sql, 'with value:', userId);  // Log the SQL query

    // Execute the query using the provided userId
    const [rides] = await db.query(sql, [userId]);

    // Log the query result to see what is returned
    console.log('Query Result:', rides);

    // If no rides are found, return a 404 error
    if (rides.length === 0) {
      console.log('No rides found for User ID:', userId);
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Log the rides found and send them as the response
    console.log('Found Rides:', rides);
    res.json(rides);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch ride history' });
  }
});
app.get('/api/rides/driver/:driverUid', async (req, res) => {
  try {
    // Extract the userId from the URL parameter
    const driverUid = req.params.driverUid.trim(); // Get the userId from the URL
    console.log('Received Driver Uid from URL:', driverUid);  // Log the userId

    // SQL query to fetch rides based on the driver_uid
    const sql = 'SELECT * FROM rides WHERE driver_uid = ?';
    console.log('Executing SQL Query:', sql, 'with value:', driverUid);  // Log the SQL query

    // Execute the query using the provided userId
    const [rides] = await db.query(sql, [driverUid]);

    // Log the query result to see what is returned
    console.log('Query Result:', rides);

    // If no rides are found, return a 404 error
    if (rides.length === 0) {
      console.log('No rides found for User ID:', driverUid);
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Log the rides found and send them as the response
    console.log('Found Rides:', rides);
    res.json(rides);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch ride history' });
  }
});


app.get('/test', async (req, res) => {
  try {
    // Hardcoded driver UID for testing
    const driverUid = '1801';  // Example, you can replace with a real driver UID for testing

    // SQL query for testing
    const sql = 'SELECT * FROM rides WHERE driver_uid = ?';
    console.log('Executing SQL Query:', sql, 'with value:', driverUid);

    // Execute the query and fetch rides
    const [rides] = await db.query(sql, [driverUid]);

    // Send the result back
    res.json(rides);

  } catch (error) {
    console.error('Database query failed:', error);
    // Handle errors gracefully
    res.status(500).json({ error: 'Failed to fetch ride history' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to fetch driver profile
app.get('/driver/profile/:driverUid', async (req, res) => {
  const driverUid = req.params.driverUid; // Match the parameter name
  try {
    const [driver] = await db.query('SELECT * FROM drivers WHERE uid = ?', [driverUid]);
    if (driver.length > 0) {
      // Modify the driver object to include the full photo URL
      const driverData = driver[0];
      driverData.driver_photo = `http://localhost:3000/uploads/${driverData.driver_photo}`;
      driverData.license_photo = `http://localhost:3000/uploads/${driverData.license_photo}`;
      driverData.citizenship_photo = `http://localhost:3000/uploads/${driverData.citizenship_photo}`;
      res.status(200).json(driverData);
    } else {
      res.status(404).json({ message: 'Driver not found' });
    }
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ message: 'Error fetching driver profile', error });
  }
});

app.post('/upload', upload.single('photo'), (req, res) => {
  if (req.file) {
    res.status(200).json({ message: 'Photo uploaded successfully!' });
  } else {
    res.status(400).json({ message: 'No file uploaded!' });
  }
});
app.post('/driver/photo/:driverUid', upload.single('driver_photo'), async (req, res) => {
  const driverUid = req.params.driverUid;
  const driverPhoto = req.file.filename;

  try {
    const result = await db.query('SELECT * FROM drivers WHERE uid = ?', [driverUid]);
    if (result.length === 0) {
      console.log(`Driver UID ${driverUid} not found.`);
      return res.status(404).json({ message: 'Driver not found.' });
    }

    const photoUrl = `http://localhost:3000/uploads/${driverPhoto}`;
    const updateResult = await db.query('UPDATE drivers SET driver_photo = ? WHERE uid = ?', [photoUrl, driverUid]);

    if (updateResult.affectedRows > 0) {
      res.status(200).json({ message: 'Driver photo updated successfully.' });
    } else {
      res.status(500).json({ message: 'Error updating driver photo.' });
    }
  } catch (error) {
    console.error('Error updating driver photo:', error);
    res.status(500).json({ message: 'Error updating driver photo.', error });
  }
});









// Assume this is a part of your existing API route handler
app.get('/api/earnings/driver/:driverUid', async (req, res) => {
  try {
    // Extract the driverUid from the URL parameter
    const driverUid = req.params.driverUid.trim();
    console.log('Received Driver UID from URL:', driverUid);  // Log the driverUid

    // SQL query to fetch earnings based on the driver_uid
    const sql = 'SELECT * FROM payments WHERE driver_uid = ?';
    console.log('Executing SQL Query:', sql, 'with value:', driverUid);  // Log the SQL query

    // Execute the query using the provided driverUid
    const [earnings] = await db.query(sql, [driverUid]);

    // Log the query result to see what is returned
    console.log('Query Result:', earnings);

    // If no earnings are found, return a 404 error
    if (earnings.length === 0) {
      console.log('No earnings found for Driver UID:', driverUid);
      return res.status(404).json({ error: 'No earnings found' });
    }

    // Log the earnings found and send them as the response
    console.log('Found Earnings:', earnings);
    res.json(earnings);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});
app.get('/api/reviews/driver/:driverUid', async (req, res) => {
  try {
    // Extract the driverUid from the URL parameter
    const driverUid = req.params.driverUid.trim();
    console.log('Received Driver UID from URL:', driverUid);  // Log the driverUid
    const sql = 'SELECT * FROM reviews WHERE driver_uid = ?;';
    console.log('Executing SQL Query:', sql, 'with value:', driverUid);  // Log the SQL query

    // Execute the query using the provided driverUid
    const [reviews] = await db.query(sql, [driverUid]);
    console.log('Query Result:', reviews);
    if (reviews.length === 0) {
      console.log('No reviews found for Driver UID:', driverUid);
      return res.status(404).json({ error: 'No reviews found' });
    }
    console.log('Found reviews:', reviews);
    res.json(reviews);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});
app.get('/api/reviews/user/:userId', async (req, res) => {
  try {
    // Extract the driverUid from the URL parameter
    const userId = req.params.userId.trim();
    console.log('Received User ID from URL:', userId);  // Log the driverUid
    const sql = 'SELECT * FROM reviews WHERE user_id = ?;';
    console.log('Executing SQL Query:', sql, 'with value:', userId);  // Log the SQL query

    // Execute the query using the provided driverUid
    const [reviews] = await db.query(sql, [userId]);
    console.log('Query Result:', reviews);
    if (reviews.length === 0) {
      console.log('No reviews found for User ID:', userId);
      return res.status(404).json({ error: 'No reviews found' });
    }
    console.log('Found reviews:', reviews);
    res.json(reviews);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});
app.get('/api/driver_ratings/driver/:driverUid', async (req, res) => {
  try {
    const driverUid = req.params.driverUid.trim();
    console.log('Received Driver UID from URL:', driverUid);  // Log the driverUid

    const sql = `
      SELECT AVG(driver_rating) AS average_rating
      FROM driver_ratings
      WHERE driver_uid = ?;
    `;
    console.log('Executing SQL Query:', sql, 'with value:', driverUid);  // Log the SQL query

    const [result] = await db.query(sql, [driverUid]);
    console.log('Query Result:', result);

    const averageRating = result[0].average_rating;
    console.log('Average Rating Type:', typeof averageRating);
    console.log('Average Rating Value:', averageRating);

    if (averageRating === null || isNaN(averageRating)) {
      console.log('No ratings found or invalid average rating for Driver UID:', driverUid);
      return res.status(404).json({ error: 'No ratings found for the specified driver.' });
    }

    const formattedAverageRating = parseFloat(averageRating).toFixed(2);
    console.log('Calculated Average Rating:', formattedAverageRating);

    res.json({ average_rating: formattedAverageRating });
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch ratings', details: error.message });
  }
});
app.get('/api/user_ratings/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId.trim();
    console.log('Received user ID from URL:', userId);  // Log the userId

    const sql = `
      SELECT AVG(user_rating) AS average_rating
      FROM reviews
      WHERE user_id = ?;
    `;
    console.log('Executing SQL Query:', sql, 'with value:', userId);  // Log the SQL query

    const [result] = await db.query(sql, [userId]);
    console.log('Query Result:', result);

    const averageRating = result[0].average_rating;
    console.log('Average Rating Type:', typeof averageRating);
    console.log('Average Rating Value:', averageRating);

    if (averageRating === null || isNaN(averageRating)) {
      console.log('No ratings found or invalid average rating for user ID:', userId);
      return res.status(404).json({ error: 'No ratings found for the specified driver.' });
    }

    const formattedAverageRating = parseFloat(averageRating).toFixed(2);
    console.log('Calculated Average Rating:', formattedAverageRating);

    res.json({ average_rating: formattedAverageRating });
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch ratings', details: error.message });
  }
});

app.get('/api/rides/user/:userId', async (req, res) => {
  try {
    // Extract the userId from the URL parameter
    const userId = req.params.userId.trim(); // Get the userId from the URL
    console.log('Received User ID from URL:', userId);  // Log the userId

    // SQL query to fetch rides based on the user_id
    const sql = 'SELECT * FROM rides WHERE user_id = ?';
    console.log('Executing SQL Query:', sql, 'with value:', userId);  // Log the SQL query

    // Execute the query using the provided userId
    const [rides] = await db.query(sql, [userId]);

    // Log the query result to see what is returned
    console.log('Query Result:', rides);

    // If no rides are found, return a 404 error
    if (rides.length === 0) {
      console.log('No rides found for User ID:', userId);
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Log the rides found and send them as the response
    console.log('Found Rides:', rides);
    res.json(rides);
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({ error: 'Failed to fetch ride history' });
  }
});
app.get('/user/profile/:userId', async (req, res) => {
  const userId = req.params.userId; // Match the parameter name
  try {
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length > 0) {
      // Modify the user object to include the full photo URL if applicable
      const userData = user[0];
      if (userData.image_url) {
        userData.image_url = `http://localhost:3000/uploads/${userData.image_url}`;
      }
      res.status(200).json(userData);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error });
  }
});
app.use('/profile', updateProfileRouter);
function getBaseUrl() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://10.0.2.2:3000';  // Local development
  } else {
    return 'http://localhost:3000';  // Production environment
  }
}

app.get('/api/users/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  try {
    const user = await UserModel.findById(userId);  // Adjusted for Sequelize/SQL UserModel

    if (user) {
      // Format image URL if exists
      if (user.image_url) {
        user.image_url = `http://localhost:3000/uploads/${user.image_url}`;
      }

      // Fetch the average rating for the user
      const ratingResponse = await axios.get(`${getBaseUrl()}/api/user_ratings/user/${userId}`);
      const averageRating = ratingResponse.data.average_rating;

      res.json({ 
        first_name: user.first_name, 
        last_name: user.last_name,
        image: user.image_url,          
        average_rating: averageRating  // Include user average rating
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);  // Log the error for debugging
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
