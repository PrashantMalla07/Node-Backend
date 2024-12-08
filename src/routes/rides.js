import express from 'express';
import { createRide, getRideDetails, updateRideStatus } from '../controllers/ridesController.js';

const rideRouter = express.Router();

rideRouter.post('/', createRide); // Create a new ride
rideRouter.get('/:rideId', getRideDetails); // Get ride details by ID
rideRouter.patch('/:rideId', updateRideStatus); // Update ride status

export default rideRouter;
