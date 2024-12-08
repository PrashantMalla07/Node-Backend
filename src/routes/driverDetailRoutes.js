import express from 'express';
import { fetchDriverDetails } from '../controllers/driverDetailController.js';

const driverDetailRouter = express.Router();

driverDetailRouter.get('/details', fetchDriverDetails);

export default driverDetailRouter;
