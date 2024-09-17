const db = require('../config/db'); // Adjust the path as necessary

class UserModel {
  static async create({ firstName, lastName, email, phoneNumber, password }) {
    try {
      const query = 'INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)';
      const [result] = await db.execute(query, [firstName, lastName, email, phoneNumber, password]);
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async findByEmailOrPhone(identifier) {
  try {
    const query = 'SELECT * FROM users WHERE email = ? OR phone_number = ?';
    const [rows] = await db.execute(query, [identifier, identifier]);
    return rows[0] || null; // Return the user object or null if not found
  } catch (error) {
    console.error('Error finding user by email or phone:', error);
    throw new Error('Failed to find user');
  }
}


  // Additional methods as needed...
}

module.exports = UserModel;
