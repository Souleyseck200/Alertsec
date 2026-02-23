import prisma from '../lib/prisma';

class NotificationService {
  /**
   * Crée une notification pour un utilisateur spécifique
   */
  async create(userId: number, title: string, message: string, signalementId?: number) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          titre: title,
          message,
          signalementId,
          estLu: false
        }
      });
    } catch (error) {
      console.error('Notification creation failed:', error);
    }
  }

  /**
   * Notifie tous les agents d'une zone spécifique
   */
  async notifyAgentsInZone(zoneId: number, title: string, message: string, signalementId: number) {
    try {
      const agents = await prisma.user.findMany({
        where: { zoneId, role: 'AGENT' }
      });

      const notifications = agents.map(agent => 
        this.create(agent.id, title, message, signalementId)
      );

      await Promise.all(notifications);
    } catch (error) {
      console.error('Notify agents failed:', error);
    }
  }

  /**
   * Notifie le citoyen de l'état de son signalement
   */
  async notifyCitoyen(signalementId: number, statusMessage: string) {
    try {
      const signalement = await prisma.signalement.findUnique({
        where: { id: signalementId },
        select: { citoyenId: true, type: true }
      });

      if (signalement) {
        await this.create(
          signalement.citoyenId,
          `Mise à jour SOS : ${signalement.type}`,
          statusMessage,
          signalementId
        );
      }
    } catch (error) {
      console.error('Notify citoyen failed:', error);
    }
  }
}

export default new NotificationService();
