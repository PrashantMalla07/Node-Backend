import express from 'express';
import DriverController from '../controllers/driverController.js';

const driverRouter = express.Router();

// Registration route
driverRouter.post('/register', DriverController.register);

// Login route
driverRouter.post('/login', DriverController.login); // Ensure this route exists

export default driverRouter;
