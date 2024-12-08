import db from '../config/db.mjs';

export const createPayment = async (req, res) => {
  const { user_id, amount, method, status } = req.body;

  try {
    await db.query(
      'INSERT INTO payments (user_id, amount, method, status) VALUES (?, ?, ?, ?)',
      [user_id, amount, method, status]
    );
    res.status(201).json({ message: 'Payment created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};

export const getPaymentDetails = async (req, res) => {
  const { paymentId } = req.params;

  try {
    const [paymentDetails] = await db.query(
      'SELECT * FROM payments WHERE payment_id = ?',
      [paymentId]
    );
    if (paymentDetails.length > 0) {
      res.status(200).json(paymentDetails[0]);
    } else {
      res.status(404).json({ message: 'Payment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error });
  }
};
