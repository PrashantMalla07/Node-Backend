import db from '../config/db.mjs';
export const addReview = async (req, res) => {
  const { ride_id, driver_id, rating, review } = req.body;

  try {
    await db.query(
      'INSERT INTO reviews (ride_id, driver_id, rating, review) VALUES (?, ?, ?, ?)',
      [ride_id, driver_id, rating, review]
    );
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};

export const getReviewsForDriver = async (req, res) => {
  const { driverId } = req.params;

  try {
    const [reviews] = await db.query('SELECT * FROM reviews WHERE driver_id = ?', [driverId]);
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};
