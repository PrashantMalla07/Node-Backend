import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import db from '../config/db.mjs';

const updateProfileRouter = express.Router();

// Ensure 'uploads' directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

updateProfileRouter.post('/updateProfile', upload.single('image'), (req, res) => {
  try {
    console.log('Incoming Request:');
    console.log('File uploaded:', req.file);
    console.log('Request Body:', req.body);

    const { first_name, last_name, email, phone_number, id, image } = req.body;

    let imageUrl = req.file ? '/uploads/' + req.file.filename : image;

    // Ensure imageUrl is always a string
    imageUrl = imageUrl || image;

    // Input Validation
    if (!first_name || !last_name || !email || !phone_number || !id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, phone_number = ?, image_url = ? 
      WHERE id = ?`;

    db.query(query, [first_name, last_name, email, phone_number, imageUrl, id], (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Error updating profile' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'Profile updated successfully', imageUrl });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default updateProfileRouter;
