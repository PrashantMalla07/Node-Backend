import express from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import multer from 'multer';
import db from '../config/db.mjs';

const switchDriverRouter = express.Router();

// Ensure upload directory exists
const uploadPath = './uploads/';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage: storage });

// Switch to Driver Endpoint
switchDriverRouter.post(
  '/switch-to-driver',
  upload.fields([
    { name: 'driverPhoto', maxCount: 1 },
    { name: 'licensePhoto', maxCount: 1 },
    { name: 'citizenshipPhoto', maxCount: 1 }
  ]),
  [
    body('userId').isInt().withMessage('User ID must be an integer'),
    body('licenseNumber').isLength({ min: 5 }).withMessage('License number must be at least 5 characters'),
    body('citizenshipId').isLength({ min: 5 }).withMessage('Citizenship ID must be at least 5 characters'),
    body('vehicleType').isLength({ min: 2 }).withMessage('Vehicle type must be at least 2 characters'),
    body('vehicleColor').isLength({ min: 2 }).withMessage('Vehicle color must be at least 2 characters'),
    body('vehicleNumber').isLength({ min: 5 }).withMessage('Vehicle number must be at least 5 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, licenseNumber, citizenshipId, vehicleType, vehicleColor, vehicleNumber } = req.body;

    // Retrieve uploaded file paths
    const driverPhotoPath = req.files?.driverPhoto?.[0]?.path || null;
    const licensePhotoPath = req.files?.licensePhoto?.[0]?.path || null;
    const citizenshipPhotoPath = req.files?.citizenshipPhoto?.[0]?.path || null;

    // Validate file uploads
    if (!driverPhotoPath || !licensePhotoPath || !citizenshipPhotoPath) {
      return res.status(400).json({
        error: 'All photo uploads are required: driverPhoto, licensePhoto, and citizenshipPhoto.'
      });
    }

    try {
      // Check if user exists
      const [user] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
      if (!user.length) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Insert driver details
      await db.query(
        `INSERT INTO drivers (
          user_id, license_number, citizenship_id, driver_photo,
          license_photo, citizenship_photo, vehicle_type,
          vehicle_color, vehicle_number, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          userId,
          licenseNumber,
          citizenshipId,
          driverPhotoPath,
          licensePhotoPath,
          citizenshipPhotoPath,
          vehicleType,
          vehicleColor,
          vehicleNumber
        ]
      );

      res.status(200).json({ message: 'Driver application submitted successfully. Awaiting admin verification.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default switchDriverRouter;
