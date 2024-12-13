import bcrypt from 'bcrypt';
import express from 'express';
import multer from 'multer';
import db from '../config/db.mjs';

const driverRouter = express.Router();

// Configure Multer for file uploads
const upload = multer({
    dest: 'uploads/', // Files will be saved in the 'uploads' folder
    limits: { fileSize: 20 * 1024 * 1024 } // Limit file size to 20MB
});

// Driver Registration Endpoint
driverRouter.post('/driver-register', upload.fields([
    { name: 'driverPhoto', maxCount: 1 },
    { name: 'licensePhoto', maxCount: 1 },
    { name: 'citizenshipPhoto', maxCount: 1 }
]), async (req, res) => {
    const { firstName, lastName, email, phoneNumber, licenseNumber, citizenshipId, vehicleType, vehicleColor, vehicleNumber, password } = req.body;

    try {
        // Check for existing driver (email or phone number)
        const [existingDriver] = await db.execute(
            'SELECT * FROM drivers WHERE email = ? OR phone_number = ?',
            [email, phoneNumber]
        );
        if (existingDriver.length > 0) {
            return res.status(400).json({ success: false, message: 'Driver already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const uid = Math.floor(1000 + Math.random() * 9000);  // Generate a UUID for the driver

        // Get file paths
        const driverPhotoPath = req.files?.driverPhoto?.[0]?.path || '';
        const licensePhotoPath = req.files?.licensePhoto?.[0]?.path || '';
        const citizenshipPhotoPath = req.files?.citizenshipPhoto?.[0]?.path || '';

        // Insert driver data
        await db.execute(
            `INSERT INTO drivers (
                uid, first_name, last_name, email, phone_number, password,
                license_number, citizenship_id, driver_photo,
                license_photo, citizenship_photo, vehicle_type,
                vehicle_color, vehicle_number, is_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, 0)`,
            [
                uid, firstName, lastName, email, phoneNumber, hashedPassword,
                licenseNumber, citizenshipId, driverPhotoPath,
                licensePhotoPath, citizenshipPhotoPath, vehicleType,
                vehicleColor, vehicleNumber
            ]
        );

        res.status(201).json({ success: true, message: 'Driver registered successfully' });
    } catch (error) {
        console.error('Error during driver registration:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default driverRouter;
