const db = require('../config/db'); // Ensure this is pointing to the correct file

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
    const query = `
      SELECT * FROM users 
      WHERE email = ? OR phone_number = ?
    `;
    console.log('Identifier:', identifier);  // Log the identifier for debugging
    const [rows] = await db.execute(query, [identifier, identifier]);
    console.log('User found:', rows[0]); // Log the user fetched from DB
    return rows[0];
  }
  
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
  static async updatePassword(id, newPassword) {
    try {
        const query = 'UPDATE users SET password = ? WHERE id = ?';
        const [result] = await db.execute(query, [newPassword, id]);
        
        if (result.affectedRows === 0) {
            console.error('Error updating password: No rows affected.');
            throw new Error('Password update failed');
        }
        
        console.log('Password updated successfully for user ID:', id);
        return result;
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
}
static async updateAdminStatus(id, isAdmin) {
  try {
    const query = 'UPDATE users SET is_admin = ? WHERE id = ?';
    const [result] = await db.execute(query, [isAdmin ? 1 : 0, id]);
    
    if (result.affectedRows === 0) {
      console.error('Error updating admin status: No rows affected.');
      throw new Error('Admin status update failed');
    }
    
    console.log('Admin status updated successfully for user ID:', id);
    return result;
  } catch (error) {
    console.error('Error updating admin status:', error);
    throw error;
  }
}
}

module.exports = UserModel;
