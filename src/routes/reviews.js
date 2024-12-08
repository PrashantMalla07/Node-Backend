import express from 'express';
import { addReview, getReviewsForDriver } from '../controllers/reviewsController.js';

const reviewsRouter = express.Router();

reviewsRouter.post('/', addReview); // Add a new review
reviewsRouter.get('/:driverId', getReviewsForDriver); // Get reviews for a driver

export default reviewsRouter;
