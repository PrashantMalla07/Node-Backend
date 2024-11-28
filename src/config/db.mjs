import dotenv from 'dotenv';
import mysql from 'mysql2';

dotenv.config();
// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Ensure these match your .env file
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port:3307,
  connectionLimit: 10 // Adjust this based on your needs
});

// Export the pool with promise-based API for async/await
export default pool.promise();
