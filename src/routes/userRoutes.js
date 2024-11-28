import express from 'express';
import UserController from '../controllers/userController.js';

const userRouter = express.Router();

// Registration route
userRouter.post('/register', UserController.register);

// Login route
userRouter.post('/login', UserController.login); // Ensure this route exists

export default userRouter;
