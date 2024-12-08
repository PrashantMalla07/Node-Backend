import db from '../config/db.mjs';
export const createNotification = async (req, res) => {
  const { user_id, driver_id, message, type } = req.body;

  try {
    await db.query(
      'INSERT INTO notifications (user_id, driver_id, message, type) VALUES (?, ?, ?, ?)',
      [user_id, driver_id, message, type]
    );
    res.status(201).json({ message: 'Notification created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};

export const getNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? OR driver_id = ?',
      [userId, userId]
    );
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};
