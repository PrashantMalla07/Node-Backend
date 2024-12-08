import express from 'express';
import { createPayment, getPaymentDetails } from '../controllers/paymentsController.js';

const paymentsRouter = express.Router();

paymentsRouter.post('/', createPayment); // Record a new payment
paymentsRouter.get('/:paymentId', getPaymentDetails); // Get payment details

export default paymentsRouter;
