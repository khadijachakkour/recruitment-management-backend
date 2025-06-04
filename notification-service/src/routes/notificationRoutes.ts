import { Router, Request, Response } from 'express';
import { getNotifications, getLastNotification, countUnreadNotifications, markAllAsRead } from '../controller/notificationController';

const router = Router();

router.get('/notifications', (req: Request, res: Response) => {
  getNotifications(req, res);
});

router.get('/notification', (req: Request, res: Response) => {
  getLastNotification(req, res);
});

router.get('/notifications/unread/count', (req: Request, res: Response) => { countUnreadNotifications(req, res); });

router.post('/notifications/mark-all-read', (req: Request, res: Response) => { markAllAsRead(req, res);});

export default router;