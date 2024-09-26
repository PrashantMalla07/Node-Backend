const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/db'); // Import your database connection
const multer = require('multer');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // You can change the path as needed
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Switch user to driver mode and create driver details
router.post(
  '/switch-to-driver',
  upload.fields([
    { name: 'driverPhoto', maxCount: 1 },
    { name: 'licensePhoto', maxCount: 1 },
    { name: 'citizenshipPhoto', maxCount: 1 }
  ]),
  [
    body('userId').isInt(),
    body('licenseNumber').isLength({ min: 5 }),
    body('citizenshipId').isLength({ min: 5 }),
    body('vehicleType').isLength({ min: 2 }),
    body('vehicleColor').isLength({ min: 2 }),
    body('vehicleNumber').isLength({ min: 5 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      userId,
      licenseNumber,
      citizenshipId,
      vehicleType,
      vehicleColor,
      vehicleNumber
    } = req.body;

    // Retrieve file paths if the images are uploaded
    const driverPhotoPath = req.files && req.files['driverPhoto'] ? req.files['driverPhoto'][0].path : null;
    const licensePhotoPath = req.files && req.files['licensePhoto'] ? req.files['licensePhoto'][0].path : null;
    const citizenshipPhotoPath = req.files && req.files['citizenshipPhoto'] ? req.files['citizenshipPhoto'][0].path : null;

    // Check if files are uploaded
    if (!driverPhotoPath || !licensePhotoPath || !citizenshipPhotoPath) {
      return res.status(400).json({ error: 'All photo uploads are required (driver, license, and citizenship).' });
    }

    try {
      // Insert driver details into the database
      await db.query(
        'INSERT INTO drivers (user_id, license_number, citizenship_id, driver_photo, license_photo, citizenship_photo, vehicle_type, vehicle_color, vehicle_number, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
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

      res.status(200).json({ message: 'Driver application submitted. Awaiting admin verification.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
