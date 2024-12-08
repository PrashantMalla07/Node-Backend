import db from '../config/db.mjs';

export const createRide = async (req, res) => {
  const { user_id, driver_id, pickup_location, dropoff_location, distance, fare } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO rides (user_id, driver_id, pickup_location, dropoff_location, distance, fare, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, driver_id, pickup_location, dropoff_location, distance, fare, 'pending']
    );
    res.status(201).json({ rideId: result.insertId, message: 'Ride created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};

export const getRideDetails = async (req, res) => {
  const { rideId } = req.params;

  try {
    const [ride] = await db.query('SELECT * FROM rides WHERE id = ?', [rideId]);
    if (!ride.length) return res.status(404).json({ error: 'Ride not found' });

    res.status(200).json(ride[0]);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};

export const updateRideStatus = async (req, res) => {
  const { rideId } = req.params;
  const { status } = req.body;

  try {
    await db.query('UPDATE rides SET status = ? WHERE id = ?', [status, rideId]);
    res.status(200).json({ message: 'Ride status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};
