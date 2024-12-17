import express from 'express';
import { createRideRequest, getRideRequests } from '../controllers/rideRequestsController.js';

const rideRequestRouter = express.Router();

rideRequestRouter.post('/', createRideRequest); // Create a ride request
rideRequestRouter.get('/getRide', getRideRequests); // Get ride requests for a user

export default rideRequestRouter;
