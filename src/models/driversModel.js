// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');

// const Driver = sequelize.define('Driver', {
//   first_name: {
//     type: DataTypes.STRING(50),
//     allowNull: false
//   },
//   last_name: {
//     type: DataTypes.STRING(50),
//     allowNull: false
//   },
//   email: {
//     type: DataTypes.STRING(100),
//     allowNull: false,
//     unique: true
//   },
//   phone_number: {
//     type: DataTypes.STRING(15),
//     allowNull: false
//   },
//   password: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   created_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW
//   },
//   license_number: {
//     type: DataTypes.STRING(20),
//     allowNull: false
//   },
//   citizenship_id: {
//     type: DataTypes.STRING(20),
//     allowNull: false
//   },
//   license_photo: {
//     type: DataTypes.STRING,
//     allowNull: true
//   },
//   citizenship_photo: {
//     type: DataTypes.STRING,
//     allowNull: true
//   },
//   is_verified: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false
//   },
//   driver_photo: {
//     type: DataTypes.STRING,
//     allowNull: true
//   },
//   vehicle_type: {
//     type: DataTypes.STRING(50),
//     allowNull: false
//   },
//   vehicle_color: {
//     type: DataTypes.STRING(20),
//     allowNull: false
//   },
//   vehicle_number: {
//     type: DataTypes.STRING(20),
//     allowNull: false
//   }
// }, {
//   tableName: 'drivers',
//   timestamps: false
// });

// module.exports = Driver;
import db from '../config/db.mjs';

class DriverModel {
  // static async create({ firstName, lastName, email, phoneNumber, password }) {
  //   try {
  //     const query = 'INSERT INTO users (first_name, last_name, email, phone_number, password) VALUES (?, ?, ?, ?, ?)';
  //     const [result] = await db.execute(query, [firstName, lastName, email, phoneNumber, password]);
  //     return result.insertId;
  //   } catch (error) {
  //     console.error('Error creating user:', error);
  //     throw new Error('Failed to create user');
  //   }
  // }

  static async findByEmailOrPhone(identifier) {
    const query = `
      SELECT * FROM drivers 
      WHERE email = ? OR phone_number = ?
    `;
    console.log('Identifier:', identifier);  // Log the identifier for debugging
    const [rows] = await db.execute(query, [identifier, identifier]);
    console.log('User found:', rows[0]); // Log the user fetched from DB
    return rows[0];
  }
  
  static async findByEmailOrPhone(identifier) {
    console.log('Searching for:', identifier); // Log identifier
    const query = `SELECT * FROM drivers WHERE email = ? OR phone_number = ?`;
    const [rows] = await db.execute(query, [identifier, identifier]);
    console.log('Database result:', rows); // Log database result
    return rows[0];
}

  static async updatePassword(id, newPassword) {
    try {
        const query = 'UPDATE drivers SET password = ? WHERE id = ?';
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

}

export default DriverModel;
