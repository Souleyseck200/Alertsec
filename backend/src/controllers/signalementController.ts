import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import signalementService, { signalementSchema } from '../services/signalementService';
import notificationService from '../services/notificationService';
import { z } from 'zod';

class SignalementController {
  async createSignalement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const validatedData = signalementSchema.parse(req.body);
      
      // Extraction des fichiers multiples (avec sécurité maximale)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      let mediaUrl = null;
      let audioUrl = null;
      let videoUrl = null;

      if (files) {
        if (files['media'] && files['media'][0]) mediaUrl = `/uploads/signalements/${files['media'][0].filename}`;
        if (files['audio'] && files['audio'][0]) audioUrl = `/uploads/signalements/${files['audio'][0].filename}`;
        if (files['video'] && files['video'][0]) videoUrl = `/uploads/signalements/${files['video'][0].filename}`;
      }

      const signalement = await signalementService.create(
        validatedData, 
        userId, 
        mediaUrl, 
        audioUrl, 
        videoUrl
      );

      // Notification automatique aux agents de la zone détectée
      if (signalement.zoneId) {
        await notificationService.notifyAgentsInZone(
          signalement.zoneId,
          'Nouveau Signalement SOS',
          `Un incident de type ${signalement.type} a été signalé dans votre zone.`,
          signalement.id
        );
      }

      res.status(201).json(signalement);
    } catch (error) {
      next(error);
    }
  }

  async getMySignalements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const signalements = await signalementService.getHistory(userId);
      res.json(signalements);
    } catch (error) {
      next(error);
    }
  }

  async getHeatmap(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const heatmapData = await signalementService.getHeatmapData();
      res.json(heatmapData);
    } catch (error) {
      next(error);
    }
  }

  async getAllSignalements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = req.user?.role || 'CITOYEN';
      // Si c'est un agent, on pourrait filtrer par sa zone ici ou laisser le service gérer
      // Pour l'instant, getAll renvoie tout si Admin, ou filtré si Agent
      const signalements = await signalementService.getAll(role);
      res.json(signalements);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(501).json({ message: 'Use intervention module for priority status changes' });
    } catch (error) {
      next(error);
    }
  }

  async cancelSignalement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const { id } = req.params;
      const signalement = await signalementService.cancel(parseInt(id as string), userId);

      res.json(signalement);
    } catch (error) {
      next(error);
    }
  }
}

export default new SignalementController();
