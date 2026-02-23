import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import interventionService from '../services/interventionService';
import { z } from 'zod';

class InterventionController {
  async getNewSignalementsByZone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const agentId = req.user?.userId;
      if (!agentId) return res.status(401).json({ error: 'Non authentifié' });

      const signalements = await interventionService.getAvailableSignalements(agentId);
      res.json(signalements);
    } catch (error) {
      next(error);
    }
  }

  async takeCharge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const agentId = req.user?.userId;
      const { signalementId } = z.object({ signalementId: z.number() }).parse(req.body);
      
      if (!agentId) return res.status(401).json({ error: 'Non authentifié' });

      const result = await interventionService.takeCharge(signalementId, agentId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateFieldNotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = z.object({ notes: z.string().min(1) }).parse(req.body);

      const updated = await interventionService.updateNotes(parseInt(id as string), notes);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async closeIntervention(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rapport } = z.object({ rapport: z.string().min(10) }).parse(req.body);

      const result = await interventionService.close(parseInt(id as string), rapport);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  async updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const agentId = req.user?.userId;
      if (!agentId) return res.status(401).json({ error: 'Non authentifié' });

      const locationData = z.object({
        latitude: z.number(),
        longitude: z.number()
      }).parse(req.body);

      const result = await interventionService.updateAgentLocation(agentId, locationData.latitude, locationData.longitude);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRoute(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const route = interventionService.getRouteSimulation();
      res.json(route);
    } catch (error) {
      next(error);
    }
  }

  async getActiveAgents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const agents = await interventionService.getActiveAgents();
      res.json(agents);
    } catch (error) {
      next(error);
    }
  }
}

export default new InterventionController();
