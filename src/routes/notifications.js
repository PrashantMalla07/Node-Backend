import express from 'express';
import { createNotification, getNotifications } from '../controllers/notificationsController.js';

const notificationsRouter = express.Router();

notificationsRouter.post('/', createNotification); // Create a notification
notificationsRouter.get('/:userId', getNotifications); // Get notifications for a user/driver

export default notificationsRouter;
