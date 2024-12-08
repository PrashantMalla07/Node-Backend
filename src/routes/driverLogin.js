import bcrypt from 'bcryptjs'; // Use bcryptjs instead of bcrypt
import express from 'express';
import jwt from 'jsonwebtoken'; // For token generation, if needed
import DriverModel from '../../src/models/driversModel.js'; // Adjust this path based on your folder structure

const driverLoginRouter = express.Router();

// Driver Login Endpoint
driverLoginRouter.post('/driver-login', async (req, res) => {
    console.log(req.body); 
    const { email, phoneNumber, password } = req.body;

    // Check for missing identifier or password
    if ((!email && !phoneNumber) || !password) {
        return res.status(400).json({ message: 'Identifier (email or phone number) and password are required' });
    }

    try {
        // If both email and phoneNumber are provided, use the one that exists
        const identifier = email || phoneNumber;

        // Log the identifier being used for debugging
        console.log('Using identifier for login:', identifier);

        // Find user by email or phone number
        const user = await DriverModel.findByEmailOrPhone(identifier);

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
            { id: user.id, email: user.email },
            'your_secret_key', // Replace with your actual secret key
            { expiresIn: '1y' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            driver: {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phoneNumber: user.phone_number,
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


export default driverLoginRouter;
