import express from 'express';
import UserController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const userRouter = express.Router();

// // Registration route
// userRouter.post('/register', UserController.register);

// // Login route
// userRouter.post('/login', UserController.login); // Ensure this route exists
userRouter.get('/user-profile', authMiddleware, UserController.getUserProfile);
export default userRouter;
