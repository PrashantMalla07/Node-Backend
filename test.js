// const express = require('express');
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const bodyParser = require('body-parser');

// // Create an Express app
// const app = express();

// // Middleware to parse JSON bodies
// app.use(bodyParser.json());

// // Example user data (in a real application, this would be from a database)
// const users = [
//   {
//     id: 1,
//     username: 'user1',
//     password: '$2a$10$V0aJXaKcZg7Qb/OyKp8CNe2bhvF9JDR3/4MBJvbGzq8VgH.L7DJu6' // bcrypt hash of 'password123'
//   }
// ];

// // Secret key for JWT signing
// const secretKey = 'your-secret-key';

// // Login endpoint
// app.post('/login', (req, res) => {
//   const { username, password } = req.body;

//   // Find user by username
//   const user = users.find(u => u.username === username);

//   if (!user) {
//     return res.status(400).json({ message: 'Invalid credentials' });
//   }

//   // Compare the password with the hashed password
//   bcrypt.compare(password, user.password, (err, isMatch) => {
//     if (err || !isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Create a JWT token with a 1-year expiration
//     const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1y' });

//     // Send the Bearer token in the response
//     res.json({
//       message: 'Login successful',
//       token: token
//     });
//   });
// });

// // Start the server
// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });
