import { Request, Response } from 'express';
import Notification from '../models/notification';

export const getNotifications = async (req: Request, res: Response) => {
  const { candidatId } = req.query;
  if (!candidatId) return res.status(400).json({ error: 'candidatId requis' });
  try {
    const notifications = await Notification.findAll({
      where: { candidatId: String(candidatId) },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getLastNotification = async (req: Request, res: Response) => {
  const { candidatId } = req.query;
  if (!candidatId) {
    return res.status(400).json({ error: 'candidatId requis' });
  }

  try {
    const notification = await Notification.findOne({
      where: { candidatId: String(candidatId) },
      order: [['createdAt', 'DESC']],
    });

    if (!notification) {
      return res.status(404).json({ message: 'Aucune notification trouvée' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Erreur lors de la récupération de la dernière notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//Compter les notifications non lues
export const countUnreadNotifications = async (req: Request, res: Response) => {
  const { candidatId } = req.query;
  if (!candidatId) return res.status(400).json({ error: 'candidatId requis' });
  try {
    const count = await Notification.count({
      where: { candidatId: String(candidatId), read: false }
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

//Marquer toutes les notifications comme lues
export const markAllAsRead = async (req: Request, res: Response) => {
  const { candidatId } = req.body;
  if (!candidatId) return res.status(400).json({ error: 'candidatId requis' });
  try {
    await Notification.update({ read: true }, { where: { candidatId: String(candidatId), read: false } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};