import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../lib/prisma';

class NotificationController {
  async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const notifications = await prisma.notification.findMany({
        where: { userId },
        include: { signalement: true },
        orderBy: { dateEnvoi: 'desc' }
      });

      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const notifId = parseInt(req.params.id as string);

      const notif = await prisma.notification.findUnique({ where: { id: notifId } });
      if (!notif) return res.status(404).json({ error: 'Notification non trouvée' });
      if (notif.userId !== userId) return res.status(403).json({ error: 'Non autorisé' });

      await prisma.notification.update({
        where: { id: notifId },
        data: { estLu: true }
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
