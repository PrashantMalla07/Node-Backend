import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const saltRounds = 10; // Ensure this matches the salt rounds used during registration

// Database connection setup
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

(async () => {
  try {
    // Example new password
    const newPassword = 'newAdminPassword'; // Replace with the desired new password

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    const userId = 7; // Replace with the actual admin user ID
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';

    const [result] = await db.execute(updateQuery, [hashedPassword, userId]);
    if (result.affectedRows === 0) {
      throw new Error('Admin user not found or password update failed');
    }

    console.log('Admin password updated successfully');
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await db.end(); // Close the database connection
  }
})();
