import db from '../config/db.mjs';

export const createRideRequest = async (req, res) => {
  const { user_id, pickup_location, dropoff_location, preferred_vehicle_type } = req.body;

  try {
    if (!user_id || !pickup_location || !dropoff_location || !preferred_vehicle_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await db.query(
      'INSERT INTO ride_requests (user_id, pickup_location, dropoff_location, preferred_vehicle_type) VALUES (?, ?, ?, ?)',
      [user_id, JSON.stringify(pickup_location), JSON.stringify(dropoff_location), preferred_vehicle_type]
    );

    res.status(201).json({ rideRequestId: result.insertId, message: 'Ride request created successfully' });
  } catch (error) {
    console.error('Error creating ride request:', error);  // Log the error for debugging
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};
export const getRideRequests = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM ride_requests WHERE status = "pending" ORDER BY request_time DESC');

    if (!results.length) {
      return res.status(404).json({ message: 'No ride requests found' });
    }

    const parsedResults = results.map(request => ({
      ...request,
      pickup_location: JSON.parse(request.pickup_location),
      dropoff_location: JSON.parse(request.dropoff_location),
    }));

    res.json(parsedResults);
  } catch (error) {
    console.error('Error fetching ride requests:', error.message);
    res.status(500).json({ error: 'Failed to fetch ride requests', details: error.message });
  }
};


