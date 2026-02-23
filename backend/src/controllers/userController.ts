import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../lib/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  nom: z.string().optional(),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
});

class UserController {
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const validatedData = updateProfileSchema.parse(req.body);
      
      const file = req.file;
      const photoUrl = file ? `/uploads/profiles/${file.filename}` : undefined;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...validatedData,
          ...(photoUrl && { photoUrl })
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          adresse: true,
          photoUrl: true,
          role: true,
          points: true,
          experience: true,
          tauxReussite: true
        }
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Non authentifié' });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          adresse: true,
          photoUrl: true,
          role: true,
          points: true,
          experience: true,
          tauxReussite: true,
          grade: true,
          unite: true,
          matricule: true,
          isOccupied: true,
          zoneId: true
        }
      });

      if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          isBlocked: true,
          photoUrl: true,
          points: true,
          grade: true,
          unite: true,
          matricule: true,
          isOccupied: true,
          zoneId: true,
          telephone: true,
          specialites: true,
          cin: true
        }
      });
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
