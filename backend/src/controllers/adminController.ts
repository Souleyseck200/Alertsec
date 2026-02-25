import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import adminService from '../services/adminService';
import { z } from 'zod';

class AdminController {
  /**
   * Création d'un agent par l'admin
   */
  async createAgent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const data = z.object({
        nom: z.string().min(2),
        prenom: z.string().min(2),
        email: z.string().email(),
        telephone: z.string().optional(),
        cin: z.string().min(5).optional(),
        dateNaissance: z.string().optional(),
        groupeSanguin: z.string().optional(),
        grade: z.string().optional(),
        unite: z.string().optional(),
        specialites: z.string().optional(),
        adresse: z.string().optional(),
        zoneId: z.number().optional()
      }).parse(req.body);

      const result = await adminService.createAgent(adminId, data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mise à jour d'un agent
   */
  async updateAgent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const data = z.object({
        nom: z.string().min(2).optional(),
        prenom: z.string().min(2).optional(),
        email: z.string().email().optional(),
        telephone: z.string().optional(),
        cin: z.string().min(5).optional(),
        dateNaissance: z.string().optional(),
        groupeSanguin: z.string().optional(),
        grade: z.string().optional(),
        unite: z.string().optional(),
        specialites: z.string().optional(),
        adresse: z.string().optional(),
        zoneId: z.number().optional()
      }).parse(req.body);

      const result = await adminService.updateAgent(adminId, parseInt(id as string), data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suppression d'un agent
   */
  async deleteAgent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const result = await adminService.deleteAgent(adminId, parseInt(id as string));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupération des zones
   */
  async getZones(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const zones = await adminService.getAllZones();
      res.json(zones);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupération des agents
   */
  async getAgents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const agents = await adminService.getAllAgents();
      res.json(agents);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Création d'une zone
   */
  async createZone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const data = z.object({
        nom: z.string().min(2),
        localisation: z.string(),
        rayon_action: z.number().optional(),
        niveau_priorite: z.number().optional()
      }).parse(req.body);

      const result = await adminService.createZone(adminId, data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mise à jour d'une zone
   */
  async updateZone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const data = z.object({
        nom: z.string().min(2).optional(),
        localisation: z.string().optional(),
        rayon_action: z.number().optional(),
        niveau_priorite: z.number().optional()
      }).parse(req.body);

      const result = await adminService.updateZone(adminId, parseInt(id as string), data);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bannissement d'un utilisateur
   */
  async blockUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      const { isBlocked } = z.object({ isBlocked: z.boolean() }).parse(req.body);

      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const result = await adminService.setUserBlockStatus(adminId, parseInt(id as string), isBlocked);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider habilitation agent
   */
  async validateClearance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;

      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const result = await adminService.validateAgentClearance(adminId, parseInt(id as string));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Affectation forcée
   */
  async forceAssign(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { signalementId, agentId } = z.object({
        signalementId: z.number(),
        agentId: z.number()
      }).parse(req.body);

      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const result = await adminService.forceAssignAgent(adminId, signalementId, agentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analytics prédictifs
   */
  async getPredictions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const predictions = await adminService.getPredictiveAnalytics();
      res.json(predictions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dashboard Stats
   */
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs système
   */
  async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logs = await adminService.getSystemLogs();
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réinitialiser le mot de passe d'un agent
   */
  async resetAgentPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      const result = await adminService.resetAgentPassword(adminId, parseInt(id as string));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une zone
   */
  async deleteZone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      console.log(`[AdminController] DELETE ZONE ID: ${id}`);
      const result = await adminService.deleteZone(adminId, parseInt(id as string));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un signalement
   */
  async deleteSignalement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId;
      const { id } = req.params;
      if (!adminId) return res.status(401).json({ error: 'Non authentifié' });

      console.log(`[AdminController] DELETE SIGNALEMENT ID: ${id}`);
      const result = await adminService.deleteSignalement(adminId, parseInt(id as string));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
