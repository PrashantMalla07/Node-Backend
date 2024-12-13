// // Set up storage for Multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, './uploads/');
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     },
//   });
  
//   // Multer middleware
//   const upload = multer({ storage });
  
//   // Route to upload profile image
//   app.post('/api/user/:id/upload-image', upload.single('image'), (req, res) => {
//     const userId = req.params.id;
  
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded.' });
//     }
  
//     const imageUrl = `/uploads/${req.file.filename}`;
//     const query = 'UPDATE users SET image_url = ? WHERE id = ?';
  
//     db.query(query, [imageUrl, userId], (err, result) => {
//       if (err) {
//         return res.status(500).json({ message: 'Database update error.', error: err });
//       }
  
//       res.status(200).json({ message: 'Image uploaded successfully.', image_url: imageUrl });
//     });
//   });
  
//   // Static folder to serve uploaded images
//   app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  