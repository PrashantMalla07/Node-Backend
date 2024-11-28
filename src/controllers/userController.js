import { compare, hash } from 'bcrypt';
import UserModel from '../models/userModel.js';

class UserController {
  static async register(req, res) {
    const { first_name, last_name, email, phone_number, password } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    try {
      // Hash the password before saving it to the database
      const hashedPassword = await hash(password, 10);
      
      // Create the user with the hashed password
      const userId = await UserModel.create({
        firstName: first_name,
        lastName: last_name,
        email,
        phoneNumber: phone_number,
        password: hashedPassword
      });

      return res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Database error', error: error.message });
    }
  }

  static async login(req, res) {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    try {
      const user = await UserModel.findByEmailOrPhone(identifier);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email/phone number or password' });
      }

      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email/phone number or password' });
      }

      // Generate JWT token if required
      // const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      // return res.status(200).json({ message: 'Login successful', token });

      return res.status(200).json({
        message: 'Login successful',
        userId: user.id,
        email: user.email,
        phoneNumber: user.phone_number
      });
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Database error', error: error.message });
    }
  }
}

export default UserController;
